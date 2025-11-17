const { body } = require("express-validator");
const verifyToken = require("../middlewares/verifyToken");
const validateMiddleware = require("../middlewares/validateMiddleware");
const ensureVerifiedAndActive = require("../middlewares/ensureVerifiedAndActive");
const { cmProfileUpdate } = require("../controllers/CompanyController");
const router = require("express").Router();

const cmProfileUpdateRules = [
  body("companyName")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Nama terlalu panjang (max 100 karakter)"),

  body("companyDescription")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio terlalu panjang (max 500 karakter)"),

  body("phoneNumber")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 16 })
    .withMessage("Nomor telepon terlalu panjang (max 16 karakter)"),

  body("country").optional({ values: "falsy" }).trim(),

  body("city").optional({ values: "falsy" }).trim(),

  body("address")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Alamat terlalu panjang (max 100 karakter)"),

  body("establishedYear")
    .optional({ values: "falsy" })
    .isInt({ min: 1800, max: new Date().getFullYear() })
    .withMessage("Tahun berdiri tidak valid"),

  body("industryId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Format id industri invalid"),

  body("industryName")
    .optional({ values: "falsy" })
    .trim()
    .toLowerCase()
    .isLength({ min: 3 })
    .withMessage("Nama industri terlalu pendek (min 3 karakter)"),

  body().custom((value, { req }) => {
    if (!req.body.industryId && !req.body.industryName) {
      throw new Error("Field yang dibutuhkan masih belum lengkap");
    }
    return true;
  }),
];

//update company profile
router.put(
  "/user/cm/profile",
  verifyToken(["company"]),
  ensureVerifiedAndActive,
  cmProfileUpdateRules,
  validateMiddleware,
  cmProfileUpdate
);
