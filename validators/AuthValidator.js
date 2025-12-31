const { body } = require("express-validator");

const loginRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (email)")
    .isEmail()
    .withMessage("Format email tidak valid")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (password)"),
];

const jsRegisterRules = [
  body("username")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (username)")
    .isAlphanumeric()
    .withMessage("Username hanya boleh berisi huruf dan angka")
    .isLength({ min: 3, max: 20 })
    .withMessage("Username harus berada di antara 3-20 karakter"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (email)")
    .isEmail()
    .withMessage("Format email tidak valid")
    .normalizeEmail(),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (password)")
    .isLength({ min: 8 })
    .withMessage("Password terlalu pendek (min 8 karakter)"),

  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (fullName)")
    .isLength({min: 3, max: 100})
    .withMessage("Nama lengkap harus berada di antara 3-100 karakter"),

  body("country")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (country)"),

  body("city")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (city)"),

  body("gender")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (gender)")
    .isIn(["male", "female", "blank"])
    .withMessage("Gender invalid"),
];
const cmRegisterRules = [
  body("username")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (username)")
    .isAlphanumeric()
    .withMessage("Username hanya boleh berisi huruf dan angka")
    .isLength({ min: 3, max: 20 })
    .withMessage("Username harus berada di antara 3-20 karakter"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (email)")
    .isEmail()
    .withMessage("Format email tidak valid")
    .normalizeEmail(),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (password)")
    .isLength({ min: 8 })
    .withMessage("Password terlalu pendek (min 8 karakter)"),

  body("companyName")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (companyName)")
    .isLength({ min: 3, max: 100 })
    .withMessage("Nama perusahaan harus berada di antara 3-100 karakter"),

  body("country")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (country)"),

  body("city")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (city)"),

  body("industryId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Format id industri invalid"),

  body("industryName")
    .optional({ values: "falsy" })
    .trim()
    .toLowerCase()
    .isLength({ min: 3, max: 50 })
    .withMessage("Nama industri harus berada di antara 3-50 karakter"),

  body("websiteLink")
    .optional({ values: "falsy" })
    .trim()
    .toLowerCase()
    .isURL()
    .withMessage("Website URL format invalid"),

  body().custom((value, { req }) => {
    if (!req.body.industryId && !req.body.industryName) {
      throw new Error("Field yang dibutuhkan masih belum lengkap");
    }
    if (req.body.industryId && req.body.industryName) {
      throw new Error("Data industri invalid");
    }
    return true;
  }),
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
    googleAuthRules,
    completeGoogleRules,
}
