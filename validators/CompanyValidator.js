const { body } = require("express-validator");

const cmProfileUpdateRules = [
  body("companyName")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Nama perusahaan harus berada di antara 3-100 karakter"),

  body("companyDescription")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 3, max: 2000 })
    .withMessage("Deskripsi perusahaan harus berada di antara 3-2000 karakter"),

  body("country").optional({ values: "falsy" }).trim().toLowerCase(),

  body("city").optional({ values: "falsy" }).trim().toLowerCase(),

  body("address")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min:3, max: 100 })
    .withMessage("Alamat harus berada di antara 3-100 karakter"),

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
    .isLength({ min: 3, max: 50 })
    .withMessage("Nama industri harus berada di antara 3-50 karakter")

  ,
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
        throw new Error("ID atau nama industri wajib diisi");
      }
    }

    return true;
  }),
];

module.exports = {
  cmProfileUpdateRules,
};
