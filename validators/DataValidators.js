const { body } = require("express-validator");

const addDictionaryRules = [
  body("name")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (name)")
    .trim()
    .toLowerCase()
    .isLength({ min: 3, max: 50 })
    .withMessage("Nama kamus harus berada di antara 3-50 karakter"),

  body("type")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (type)")
    .trim()
    .toLowerCase()
    .isIn(["industry", "disability", "skill"]),

  body("disabilityType").custom((value, { req }) => {
    if (req.body.type === "disability") {
      if (!value) {
        throw new Error("Tipe disabilitas wajib diisi");
      }

      const validTypes = [
        "sensory",
        "intellectual",
        "mental",
        "physical",
        "multiple",
        "other",
      ];

      if (!validTypes.includes(value.toLowerCase().trim())) {
        throw new Error("Tipe disabilitas invalid");
      }
    }
    return true;
  }),
];

module.exports = {
  addDictionaryRules,
};
