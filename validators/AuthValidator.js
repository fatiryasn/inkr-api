const { body } = require("express-validator");

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

  body("websiteLink")
    .optional({ values: "falsy" })
    .trim()
    .toLowerCase()
    .isURL()
    .withMessage("Website URL format is invalid"),

  body().custom((value, { req }) => {
    if (!req.body.industryId && !req.body.industryName) {
      throw new Error("Field yang dibutuhkan masih belum lengkap");
    }
    if (req.body.industryId && req.body.industryName) {
      throw new Error("Industry data is invalid");
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

module.exports = {
    loginRules,
    jsRegisterRules,
    cmRegisterRules,
    verifyOtpRules,
    googleAuthRules,
    completeGoogleRules,
}
