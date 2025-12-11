const { body } = require("express-validator");

const updateUsernameRules = [
  body("username")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isAlphanumeric()
    .withMessage("Username hanya boleh berisi huruf dan angka")
    .isLength({ min: 3 })
    .withMessage("Username terlalu pendek (min 3 karakter)")
    .isLength({ max: 16 })
    .withMessage("Username terlalu panjang (max 16 karakter)"),
];

module.exports = {
  updateUsernameRules,
};
