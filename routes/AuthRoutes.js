const router = require("express").Router();
const { body } = require("express-validator");
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

const loginRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isEmail()
    .withMessage("Format email tidak valid")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap"),
];

const jsRegisterRules = [
  body("username")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isAlphanumeric()
    .withMessage("Username hanya boleh berisi huruf dan angka")
    .isLength({ min: 3 })
    .withMessage("Username terlalu pendek (min 3 karakter)")
    .isLength({ max: 16 })
    .withMessage("Username terlalu panjang (max 16 karakter)"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isEmail()
    .withMessage("Format email tidak valid")
    .normalizeEmail(),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isLength({ min: 8 })
    .withMessage("Password terlalu pendek (min 8 karakter)"),

  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap"),

  body("country")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap"),

  body("city")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap"),

  body("gender")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isIn(["male", "female", "blank"])
    .withMessage("Gender invalid"),
];

const cmRegisterRules = [
  body("username")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isAlphanumeric()
    .withMessage("Username hanya boleh berisi huruf dan angka")
    .isLength({ min: 3 })
    .withMessage("Username terlalu pendek (min 3 karakter)")
    .isLength({ max: 16 })
    .withMessage("Username terlalu panjang (max 16 karakter)"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isEmail()
    .withMessage("Format email tidak valid")
    .normalizeEmail(),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isLength({ min: 8 })
    .withMessage("Password terlalu pendek (min 8 karakter)"),

  body("companyName")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap"),

  body("country")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap"),

  body("city")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap"),

  body("industryId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Format id industri invalid"),

  body("industryName")
    .optional({ values: "falsy" })
    .trim()
    .toLowerCase()
    .isLength({ min: 3 })
    .withMessage("Nama industri minimal 3 karakter"),

  body().custom((value, { req }) => {
    if (!req.body.industryId && !req.body.industryName) {
      throw new Error("Field yang dibutuhkan masih belum lengkap");
    }
    return true;
  }),
];

const verifyOtpRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isEmail()
    .withMessage("Format email tidak valid")
    .normalizeEmail(),

  body("otp")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap"),
];

const googleAuthRules = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isEmail()
    .withMessage("Format email tidak valid")
    .normalizeEmail(),

  body("profilePicture")
    .optional({ values: "falsy" })
    .trim()
    .isURL()
    .withMessage("Format foto profil tidak valid"),
];
const completeGoogleRules = [
  body("username")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isAlphanumeric()
    .withMessage("Username hanya boleh berisi huruf dan angka")
    .isLength({ min: 3 })
    .withMessage("Username terlalu pendek (min 3 karakter)")
    .isLength({ max: 16 })
    .withMessage("Username terlalu panjang (max 16 karakter)"),

  body("country")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap"),

  body("city")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap"),

  body("gender")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isIn(["male", "female", "blank"])
    .withMessage("Gender invalid"),
];

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

// //me
// router.get('/me', verifyToken(), )

//token
router.get("/token", token);

//logout
router.delete("/logout", logout);


module.exports = router