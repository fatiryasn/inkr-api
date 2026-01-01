const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const {
  User,
  UserProfile,
  Company,
  Industry,
  RegisterRequest,
} = require("../models");
const sequelize = require("../config/database");
const { createAccessToken, createRefreshToken } = require("../utils/tokens");
const { sendVerificationLink } = require("../utils/sendVerificationLink");

/*
  ADMIN AUTH  
*/
//admin login
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({
      where: {
        email,
        role: ["admin", "super-admin"],
      },
    });
    if (!user) {
      return res.status(400).json({ message: "Email atau password salah" });
    }
    if (!user.password) {
      return res.status(400).json({ message: "Email atau password salah" });
    }
    if (user.accountStatus !== "active") {
      switch (user.accountStatus) {
        case "pending":
          message = "Akun belum diverifikasi";
          break;
        case "requested":
          message = "Akun sedang menunggu persetujuan admin";
          break;
        case "rejected":
          message = "Akun ditolak oleh admin";
          break;
        case "suspended":
          message = "Akun telah disuspend";
          break;
        case "suspended-temp":
          message = "Akun disuspend sementara";
          break;
      }

      return res.status(403).json({
        success: false,
        message,
      });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    const verifyToken = jwt.sign(
      { userId: user.id, action: "admin-login" },
      process.env.VERIFY_TOKEN_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({
      success: true,
      message: "Login berhasil, hanya perlu verifikasi OTP",
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider,
        profilePicture: user.profilePicture,
        hasGaSecret: !!user.gaSecret,
      },
      verifyToken,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
//verify otp login gauth (admin)
exports.verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const verifyToken = req.headers.authorization?.split(" ")[1];

    if (!verifyToken)
      return res
        .status(401)
        .json({ success: false, message: "Token tidak ditemukan" });

    let payload;
    try {
      payload = jwt.verify(verifyToken, process.env.VERIFY_TOKEN_SECRET);
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, message: "Token tidak valid atau kadaluarsa" });
    }
    if (payload.action !== "admin-login") {
      return res
        .status(400)
        .json({ success: false, message: "Token tidak valid atau kadaluarsa" });
    }

    const user = await User.findByPk(payload.userId);
    if (!user || !["admin", "super-admin"].includes(user.role)) {
      return res
        .status(404)
        .json({ success: false, message: "Akun tidak ditemukan" });
    }

    if (!user.gaSecret) {
      return res.status(400).json({
        success: false,
        message: "Google Authenticator belum disetup",
      });
    }

    //verify otp
    const verified = speakeasy.totp.verify({
      secret: user.gaSecret,
      encoding: "base32",
      token: otp,
      window: 1,
    });
    if (!verified) {
      return res
        .status(401)
        .json({ success: false, message: "OTP tidak valid" });
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user, "5h");

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("adminRefreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 5 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Login berhasil",
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider,
        profilePicture: user.profilePicture,
      },
      accessToken,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
//setup google auth (admin)
exports.setupGoogleAuth = async (req, res) => {
  try {
    const verifyToken = req.headers.authorization?.split(" ")[1];
    if (!verifyToken) {
      return res
        .status(401)
        .json({ success: false, message: "Token tidak ditemukan" });
    }

    //token validation
    let payload;
    try {
      payload = jwt.verify(verifyToken, process.env.VERIFY_TOKEN_SECRET);
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, message: "Token tidak valid atau kadaluarsa" });
    }
    if (payload.action !== "admin-login") {
      return res
        .status(400)
        .json({ success: false, message: "Token tidak valid atau kadaluarsa" });
    }

    //user validation
    const user = await User.findByPk(payload.userId);
    if (!user || !["admin", "super-admin"].includes(user.role)) {
      return res
        .status(404)
        .json({ success: false, message: "Akun tidak ditemukan" });
    }
    if (user.gaSecret) {
      return res.status(400).json({
        success: false,
        message: "Google Authenticator sudah disetup",
      });
    }

    //gauth secret key
    const secret = speakeasy.generateSecret({
      name: `InklusiKerja - Admin (${user.email})`,
    });

    user.gaSecret = secret.base32;
    await user.save();

    //qrcode creation
    const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    return res.status(200).json({
      success: true,
      message:
        "Google Authenticator berhasil disetup, login ulang untuk melanjutkan",
      data: qrDataUrl,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/*
  COMMON REGISTER
*/
//login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email, role: ["job-seeker", "company"] },
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    //check auth provider
    if (user.authProvider !== "local") {
      return res.status(401).json({
        success: false,
        message: "Akun ini terdaftar menggunakan login Google",
      });
    }

    //account status
    if (user.accountStatus !== "active") {
      let message = "Akun tidak dapat login";

      switch (user.accountStatus) {
        case "pending":
          message = "Akun belum diverifikasi";
          break;
        case "requested":
          message = "Akun sedang menunggu persetujuan admin";
          break;
        case "rejected":
          message = "Akun ditolak oleh admin";
          break;
        case "suspended":
          message = "Akun telah disuspend";
          break;
        case "suspended-temp":
          message = "Akun disuspend sementara";
          break;
      }

      return res.status(403).json({
        success: false,
        message,
      });
    }

    //password check
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "Password tidak tersedia untuk akun ini",
      });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
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
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Login berhasil",
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider,
        profilePicture: user.profilePicture,
      },
      accessToken,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
//job seeker register
exports.jsRegister = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { username, email, password, fullName, country, city, gender } =
      req.body;

    //conflict check
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
      transaction: t,
    });

    if (existingUser) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: "Username atau email sudah terdaftar.",
      });
    }

    // hashing password
    const hashedPassword = await bcrypt.hash(password, 10);

    //user creation
    const user = await User.create(
      {
        username,
        email,
        password: hashedPassword,
        role: "job-seeker",
        authProvider: "local",
        accountStatus: "pending",
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

    await t.commit();

    // send verification email
    const verifyToken = jwt.sign(
      { userId: user.id, action: "request-approval" },
      process.env.VERIFY_TOKEN_SECRET,
      { expiresIn: "24h" }
    );

    sendVerificationLink({
      to: user.email,
      username: user.username,
      verifyToken,
    }).catch((err) => console.error("Email error:", err));

    return res.status(201).json({
      success: true,
      message: "Akun dibuat. Silakan cek email untuk verifikasi.",
    });
  } catch (error) {
    if (t.finished !== "commit") await t.rollback();
    return res
      .status(500)
      .json({
        success: false,
        message: error.message || "Internal server error",
      });
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
      websiteLink,
    } = req.body;

    // conflict check
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
      transaction: t,
    });

    if (existingUser) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: "Username atau email sudah terdaftar.",
      });
    }

    // industry type check
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

    // hashing password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create new user + company
    const user = await User.create(
      {
        username,
        email,
        password: hashedPassword,
        role: "company",
        authProvider: "local",
        accountStatus: "pending",
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
        websiteLink,
      },
      { transaction: t }
    );

    await t.commit();

    //send verification email
    const verifyToken = jwt.sign(
      { userId: user.id, action: "request-approval" },
      process.env.VERIFY_TOKEN_SECRET,
      { expiresIn: "24h" }
    );

    sendVerificationLink({
      to: user.email,
      username: user.username,
      verifyToken,
    }).catch((err) => console.error("Email error:", err));

    return res.status(201).json({
      success: true,
      message: "Akun dibuat. Silakan cek email untuk verifikasi.",
    });
  } catch (error) {
    if (t.finished !== "commit") await t.rollback();
    return res
      .status(500)
      .json({
        success: false,
        message: error.message || "Internal server error",
      });
  }
};

//verify registration
exports.verifyRegistration = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Token tidak ditemukan" });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.VERIFY_TOKEN_SECRET);
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, message: "Token tidak valid atau kadaluarsa" });
    }
    if (payload.action !== "request-approval") {
      return res
        .status(400)
        .json({ success: false, message: "Token tidak valid atau kadaluarsa" });
    }

    const user = await User.findByPk(payload.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    //prevent double request
    const existingRequest = await RegisterRequest.findOne({
      where: {
        userId: user.id,
        status: "pending",
      },
    });
    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: "Permintaan persetujuan sudah pernah diajukan",
      });
    }

    // update status akun
    user.accountStatus = "requested";
    await user.save();

    await RegisterRequest.create({
      userId: user.id,
      status: "pending",
    });

    return res.json({
      success: true,
      message:
        "Email terverifikasi. Permintaan persetujuan berhasil dikirim ke admin.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/*
  GOOGLE AUTH
*/
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
      maxAge: 7 * 24 * 60 * 60 * 1000,
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
    return res
      .status(500)
      .json({
        success: false,
        message: error.message || "Internal server error",
      });
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
    return res
      .status(500)
      .json({
        success: false,
        message: error.message || "Internal server error",
      });
  }
};

//token
exports.token = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    const user = await User.findOne({
      where: { refreshToken, role: ["job-seeker", "company"] },
    });
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
    return res
      .status(500)
      .json({
        success: false,
        message: error.message || "Internal server error",
      });
  }
};
//admin token
exports.adminToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.adminRefreshToken;
    if (!refreshToken) return res.sendStatus(401);

    const user = await User.findOne({
      where: { refreshToken, role: ["admin", "super-admin"] },
    });
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
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
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
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Internal server error",
      });
  }
};
