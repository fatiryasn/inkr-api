const jwt = require("jsonwebtoken");

const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      req.user = null;
      return next();
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) {
        req.user = null;
        return next();
      }

      // Token valid
      req.user = user;
      next();
    });
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = optionalAuth;
