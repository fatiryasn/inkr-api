const { body } = require("express-validator");

const cmProfileUpdateRules = [
  body("companyName")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Nama terlalu panjang (max 100 karakter)"),

  body("companyDescription")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Bio terlalu panjang (max 1000 karakter)"),

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

  body("websiteLink")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 300 })
    .withMessage("Link website terlalu panjang (max 300 karakter)")
    .isURL()
    .withMessage("Format link website tidak valid"),

  body().custom((value, { req }) => {
    const updatingIndustry =
      req.body.industryId !== undefined || req.body.industryName !== undefined;

    if (updatingIndustry) {
      if (!req.body.industryId && !req.body.industryName) {
        throw new Error("industryId atau industryName harus diisi");
      }
    }

    return true;
  }),
];

module.exports = {
  cmProfileUpdateRules,
};
