const jwt = require("jsonwebtoken");

const verifyToken =
  (requiredRole = null) =>
  (req, res, next) => {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
        return res
          .status(401)
          .json({ success: false, message: "Token not found" });
      }

      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
          return res.status(403).json({
            success: false,
            message: "Token is invalid or already expired",
          });
        }

        req.user = user;

        if (requiredRole) {
          const roles = Array.isArray(requiredRole)
            ? requiredRole
            : [requiredRole];

          if (!roles.includes(user.role)) {
            return res.status(403).json({
              success: false,
              message: "Access denied",
            });
          }
        }

        next();
      });
    } catch (error) {
      res.status(403).json({ success: false, message: "Token is invalid" });
    }
  };

module.exports = verifyToken;
