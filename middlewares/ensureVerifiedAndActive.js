const { User } = require("../models");

const ensureVerifiedAndActive = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Token tidak valid",
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    if (!user.isActive || !user.isVerified || !user.isComplete) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    req.dbUser = user;

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = ensureVerifiedAndActive;
