const router = require("express").Router();
const validateMiddleware = require("../middlewares/validateMiddleware");
const {
  login,
  jsRegister,
  cmRegister,
  completeGoogleAuth,
  googleAuth,
  token,
  logout,
  verifyOtp,
} = require("../controllers/AuthController");
const verifyToken = require("../middlewares/verifyToken");
const { loginRules, jsRegisterRules, cmRegisterRules, verifyOtpRules, googleAuthRules, completeGoogleRules } = require("../validators/AuthValidator");



//login
router.post("/login", loginRules, validateMiddleware, login);

//job seeker register
router.post("/js-register", jsRegisterRules, validateMiddleware, jsRegister);

//company register
router.post("/cm-register", cmRegisterRules, validateMiddleware, cmRegister);

//verify otp
router.post("/verify-otp", verifyOtpRules, validateMiddleware, verifyOtp);

//google auth
router.post("/google-auth", googleAuthRules, validateMiddleware, googleAuth);

//complete google auth
router.post(
  "/complete-google",
  verifyToken(),
  completeGoogleRules,
  validateMiddleware,
  completeGoogleAuth
);

//token
router.get("/token", token);

//logout
router.delete("/logout", logout);


module.exports = router