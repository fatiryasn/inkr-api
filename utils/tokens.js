const jwt = require("jsonwebtoken");

const createAccessToken = (user, expiresIn = "15m") => {
  return jwt.sign(
    { id: user.id, name: user.username, email: user.email, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn }
  );
};

const createRefreshToken = (user, expiresIn = "3d") => {
  return jwt.sign(
    { id: user.id, name: user.username, email: user.email, role: user.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn }
  );
};

module.exports = { createAccessToken, createRefreshToken };
