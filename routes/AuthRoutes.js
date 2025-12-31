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
  verifyRegistration,
  adminLogin,
  verifyOtp,
  setupGoogleAuth,
} = require("../controllers/AuthController");
const verifyToken = require("../middlewares/verifyToken");
const {
  loginRules,
  jsRegisterRules,
  cmRegisterRules,
  googleAuthRules,
  completeGoogleRules,
} = require("../validators/AuthValidator");

//admin login
router.post("/adm-login", loginRules, validateMiddleware, adminLogin);
//verify otp admin
router.post("/adm-verify-otp", verifyOtp);
//setup google auth
router.patch("/adm-setup-gauth", setupGoogleAuth);

//login
router.post("/login", loginRules, validateMiddleware, login);

//job seeker register
router.post("/js-register", jsRegisterRules, validateMiddleware, jsRegister);
//company register
router.post("/cm-register", cmRegisterRules, validateMiddleware, cmRegister);

//verify registration
router.post("/verify-registration", verifyRegistration);

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

module.exports = router;
