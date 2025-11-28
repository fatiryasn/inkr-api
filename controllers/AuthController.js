const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { createAccessToken, createRefreshToken } = require("../utils/tokens");
const { generateOtp } = require("../utils/generateOtp");
const { User, UserProfile, Company, Industry } = require("../models");
const sequelize = require("../configs/database");
const createTransporter = require("../configs/mailer");

//login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Email atau password salah" });
    }
    if (user.isActive === false || user.isVerified === false) {
      return res.status(403).json({
        success: false,
        message: "Akun ini tidak aktif, tidak dapat login dengan akun ini.",
      });
    }
    if (user.authProvider !== "local") {
      return res
        .status(401)
        .json({ success: false, message: "Kredensial autentikasi invalid" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Email atau password salah" });
    }

    //token
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Login berhasil",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        authProvider: user.authProvider,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// job seeker register
exports.jsRegister = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { username, email, password, fullName, country, city, gender } =
      req.body;

    const existingByUsername = await User.findOne({
      where: { username },
      transaction: t,
    });
    const existingByEmail = await User.findOne({
      where: { email },
      transaction: t,
    });

    if (
      existingByUsername &&
      existingByEmail &&
      existingByUsername.id !== existingByEmail.id
    ) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: "Username atau email sudah digunakan.",
      });
    }

    if (
      (existingByUsername && existingByUsername.isVerified) ||
      (existingByEmail && existingByEmail.isVerified)
    ) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: "Username atau email sudah digunakan.",
      });
    }

    // generate OTP
    const { otp, otpExpires } = generateOtp();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user;
    if (existingByEmail || existingByUsername) {
      user = existingByEmail || existingByUsername;
      await user.update(
        {
          username,
          email,
          password: hashedPassword,
          role: "job-seeker",
          authProvider: "local",
          isComplete: true,
          isVerified: false,
          isActive: false,
          otpCode: otp,
          otpExpires,
        },
        { transaction: t }
      );

      const profile = await UserProfile.findOne({
        where: { userId: user.id },
        transaction: t,
      });
      if (profile) {
        await profile.update(
          { fullName, country, city, gender },
          { transaction: t }
        );
      } else {
        await UserProfile.create(
          {
            userId: user.id,
            fullName,
            country,
            city,
            gender,
          },
          { transaction: t }
        );
      }
    } else {
      user = await User.create(
        {
          username,
          email,
          password: hashedPassword,
          role: "job-seeker",
          authProvider: "local",
          isComplete: true,
          isVerified: false,
          isActive: false,
          otpCode: otp,
          otpExpires,
        },
        { transaction: t }
      );

      await UserProfile.create(
        {
          userId: user.id,
          fullName,
          country,
          city,
          gender,
        },
        { transaction: t }
      );
    }

    await t.commit();

    const transporter = await createTransporter();
    const info = await transporter.sendMail({
      from: `"Inklusi Kerja" <${transporter.options.auth.user}>`,
      to: email,
      subject: "Verifikasi Akun Kamu",
      html: `
        <h3>Kode verifikasi akun kamu:</h3>
        <h2>${otp}</h2>
        <p>Kode ini berlaku selama 15 menit.</p>
      `,
    });

    console.log("📧 Email preview:", nodemailer.getTestMessageUrl(info));

    return res.status(201).json({
      success: true,
      message: "Akun berhasil dibuat, hanya perlu verifikasi otp",
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider,
      },
      emailTemp: nodemailer.getTestMessageUrl(info)
    });
  } catch (error) {
    if (t.finished !== "commit") await t.rollback();
    return res.status(500).json({ success: false, message: error.message });
  }
};

//company register
exports.cmRegister = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      username,
      email,
      password,
      companyName,
      country,
      city,
      industryId,
      industryName,
      websiteLink
    } = req.body;

    const existingByUsername = await User.findOne({
      where: { username },
      transaction: t,
    });
    const existingByEmail = await User.findOne({
      where: { email },
      transaction: t,
    });

    if (
      existingByUsername &&
      existingByEmail &&
      existingByUsername.id !== existingByEmail.id
    ) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: "Username atau email sudah digunakan.",
      });
    }

    if (
      (existingByUsername && existingByUsername.isVerified) ||
      (existingByEmail && existingByEmail.isVerified)
    ) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: "Username atau email sudah digunakan.",
      });
    }

    //industry type check
    let finalIndustry = null;
    if (industryId) {
      const existingIndustry = await Industry.findByPk(industryId, {
        transaction: t,
      });
      if (!existingIndustry) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Tipe industri tidak dikenal",
        });
      }
      finalIndustry = existingIndustry;
    } else if (industryName) {
      const existingByName = await Industry.findOne({
        where: { name: industryName },
        transaction: t,
      });
      if (existingByName) {
        finalIndustry = existingByName;
      } else {
        finalIndustry = await Industry.create(
          { name: industryName },
          { transaction: t }
        );
      }
    } else {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Tipe industri wajib diisi.",
      });
    }

    //generate OTP
    const { otp, otpExpires } = generateOtp();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user;
    if (existingByEmail || existingByUsername) {
      user = existingByEmail || existingByUsername;
      await user.update(
        {
          username,
          email,
          password: hashedPassword,
          role: "company",
          authProvider: "local",
          isComplete: true,
          isActive: false,
          isVerified: false,
          otpCode: otp,
          otpExpires,
        },
        { transaction: t }
      );

      const company = await Company.findOne({
        where: { userId: user.id },
        transaction: t,
      });
      if (company) {
        await company.update(
          {
            companyName,
            country,
            city,
            industryId: finalIndustry.id,
            industryName: finalIndustry.name,
          },
          { transaction: t }
        );
      } else {
        await Company.create(
          {
            userId: user.id,
            companyName,
            country,
            city,
            industryId: finalIndustry.id,
            industryName: finalIndustry.name,
          },
          { transaction: t }
        );
      }
    } else {
      user = await User.create(
        {
          username,
          email,
          password: hashedPassword,
          role: "company",
          authProvider: "local",
          isComplete: true,
          isVerified: false,
          isActive: false,
          otpCode: otp,
          otpExpires,
        },
        { transaction: t }
      );

      await Company.create(
        {
          userId: user.id,
          companyName,
          country,
          city,
          industryId: finalIndustry.id,
          industryName: finalIndustry.name,
          websiteLink
        },
        { transaction: t }
      );
    }

    await t.commit();

    const transporter = await createTransporter();
    const info = await transporter.sendMail({
      from: `"Inklusi Kerja" <${transporter.options.auth.user}>`,
      to: email,
      subject: "Verifikasi Akun Kamu",
      html: `
        <h3>Kode verifikasi akun kamu:</h3>
        <h2>${otp}</h2>
        <p>Kode ini berlaku selama 15 menit.</p>
      `,
    });

    console.log("📧 Email preview:", nodemailer.getTestMessageUrl(info));

    return res.status(201).json({
      success: true,
      message: "Akun berhasil dibuat, hanya perlu verifikasi otp",
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider,
      },
      emailTemp: nodemailer.getTestMessageUrl(info),
    });
  } catch (error) {
    if (t.finished !== "commit") await t.rollback();
    return res.status(500).json({ success: false, message: error.message });
  }
};

//verify otp
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });

    if (user.isActive || user.isVerified)
      return res
        .status(400)
        .json({ success: false, message: "Akun sudah aktif" });

    if (user.otpCode !== otp)
      return res
        .status(400)
        .json({ success: false, message: "Kode OTP salah" });

    if (user.otpExpires < new Date())
      return res
        .status(400)
        .json({ success: false, message: "Kode OTP sudah kedaluwarsa" });

    user.isActive = true;
    user.isVerified = true;
    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Verifikasi berhasil, hanya perlu login untuk melanjutkan",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//google auth
exports.googleAuth = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { fullName, email, profilePicture } = req.body;

    const user = await User.findOne({ where: { email } });

    //login
    if (user) {
      if (user.authProvider !== "google") {
        return res.status(403).json({
          success: false,
          message: "Kredensial autentikasi invalid",
        });
      }

      const accessToken = createAccessToken(user);
      const refreshToken = createRefreshToken(user);

      user.refreshToken = refreshToken;
      await user.save();

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        message: "Login berhasil",
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          authProvider: user.authProvider,
        },
        accessToken,
      });
    }

    //register
    const newUser = await User.create(
      {
        username: `google_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        email,
        password: null,
        role: "job-seeker",
        authProvider: "google",
        isComplete: false,
        isVerified: true,
        isActive: true,
      },
      { transaction: t }
    );

    const accessToken = createAccessToken(newUser);
    const refreshToken = createRefreshToken(newUser);

    newUser.refreshToken = refreshToken;
    await newUser.save({ transaction: t });

    await UserProfile.create(
      {
        userId: newUser.id,
        fullName: fullName || "User Google",
        country: "temp",
        city: "temp",
        gender: "blank",
        profilePicture,
        phoneNumber: null,
        bio: null,
        address: null,
        dateOfBirth: null,
      },
      { transaction: t }
    );

    await t.commit();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message:
        "Berhasil membuat akun, hanya perlu melengkapi beberapa data akun anda.",
      data: {
        id: newUser.id,
        email: newUser.email,
        authProvider: newUser.authProvider,
      },
      accessToken,
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ success: false, message: error.message });
  }
};

//complete google auth
exports.completeGoogleAuth = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { username, country, city, gender } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    if (user.isComplete) {
      return res
        .status(400)
        .json({ success: false, message: "Data akun sudah lengkap" });
    }

    const existsUsername = await User.findOne({ where: { username } });
    if (existsUsername) {
      return res.status(409).json({
        success: false,
        message: "Username sudah digunakan, silakan pilih yang lain",
      });
    }

    user.username = username;
    user.isComplete = true;
    await user.save({ transaction: t });

    const profile = await UserProfile.findOne({ where: { userId } });
    if (profile) {
      profile.country = country;
      profile.city = city;
      profile.gender = gender;
      await profile.save({ transaction: t });
    }

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Profil berhasil dilengkapi",
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        isComplete: user.isComplete,
      },
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ success: false, message: error.message });
  }
};

// //me
// exports.me = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const user = await User.findByPk(userId, {
//       attributes: { exclude: ["password", "refreshToken", "otpCode", "otpExpires"] },
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

//token
exports.token = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    const user = await User.findOne({ where: { refreshToken } });
    if (!user) return res.sendStatus(403);

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err) return res.sendStatus(403);
        const newAccessToken = createAccessToken(user);
        res.status(200).json({ success: true, accessToken: newAccessToken });
      }
    );
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//logout
exports.logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(401);

  try {
    const user = await User.findOne({ where: { refreshToken } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan atau mungkin sudah logout",
      });
    }
    user.refreshToken = null;
    user.save();

    res.clearCookie("refreshToken");
    return res.status(200).json({ success: true, message: "Logout berhasil" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
