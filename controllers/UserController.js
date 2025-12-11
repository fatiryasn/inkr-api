const { User, UserProfile, Company, Industry } = require("../models");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");
const {
  extractCloudinaryPublicId,
} = require("../utils/extractCloudinaryPublicId");

// get user by id
exports.getUserById = async (req, res) => {
  try {
    const rawId = req.params.userId;
    const userId = Number(rawId);

    if (!rawId || Number.isNaN(userId) || userId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "userId tidak valid" });
    }

    const user = await User.findByPk(userId, {
      attributes: {
        exclude: ["password", "refreshToken", "otpCode", "otpExpires"],
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }
    if (!user.isActive || !user.isVerified || !user.isComplete) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    let profile = null;
    let company = null;

    if (user.role === "job-seeker") {
      profile = await UserProfile.findOne({ where: { userId } });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Profil job-seeker tidak ditemukan",
        });
      }
    }

    if (user.role === "company") {
      company = await Company.findOne({
        where: { userId },
        include: [
          {
            model: Industry,
            required: false,
          },
        ],
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          message: "Profil perusahaan tidak ditemukan",
        });
      }
    }

    //response
    const responseData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      authProvider: user.authProvider,
      isActive: user.isActive,
      isVerified: user.isVerified,
      isComplete: user.isComplete,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,

      profile:
        profile && user.role === "job-seeker"
          ? {
              fullName: profile.fullName,
              phoneNumber: profile.phoneNumber,
              bio: profile.bio,
              country: profile.country,
              city: profile.city,
              address: profile.address,
              gender: profile.gender,
              dateOfBirth: profile.dateOfBirth,
            }
          : null,

      company:
        company && user.role === "company"
          ? {
              companyName: company.companyName,
              companyDescription: company.companyDescription,
              country: company.country,
              city: company.city,
              address: company.address,
              establishedYear: company.establishedYear,
              industryId: company.industryId,
              industryName: company.industryName,
              websiteLink: company.websiteLink,
              Industry: company.Industry || null,
            }
          : null,
    };

    return res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// update username
exports.updateUsername = async (req, res) => {
  try {
    const { username } = req.body;
    const user = req.dbUser;

    const existing = await User.findOne({
      where: { username },
    });

    if (existing && existing.id === user.id) {
      return res.status(400).json({
        success: true,
        message: "Tidak ada perubahan yang dilakukan",
      });
    }

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Username sudah digunakan pengguna lain",
      });
    }

    user.username = username;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Username berhasil diperbarui",
      data: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//update profile picture
exports.updateProfilePicture = async (req, res) => {
  try {
    const user = req.dbUser;

    //no file given
    if (!req.file) {
      if (!user.profilePicture) {
        return res.status(204).send();
      }

      const oldPublicId = extractCloudinaryPublicId(user.profilePicture);
      if (oldPublicId) {
        try {
          await cloudinary.uploader.destroy(oldPublicId);
        } catch (err) {
          console.error("Gagal hapus gambar lama di Cloudinary:", err);
        }
      }

      user.profilePicture = null;
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Foto profil berhasil dihapus",
      });
    }

    if (!req.file.path) {
      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server: file path tidak tersedia",
      });
    }

    //file given
    if (user.profilePicture) {
      const oldPublicId = extractCloudinaryPublicId(user.profilePicture);
      if (oldPublicId) {
        try {
          await cloudinary.uploader.destroy(oldPublicId);
        } catch (err) {
          console.error("Gagal hapus gambar lama di Cloudinary:", err);
        }
      }
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "inkr-pfp",
    });

    user.profilePicture = result.secure_url;
    await user.save();

    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Gagal hapus file lokal:", err);
    });

    return res.status(200).json({
      success: true,
      message: "Foto profil berhasil diperbarui",
      data: { profilePicture: user.profilePicture },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
