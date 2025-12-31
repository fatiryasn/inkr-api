const { body } = require("express-validator");

const jsProfileUpdateRules = [
  body("fullName")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Nama harus berada di antara 3-100 karakter"),
  body("phoneNumber")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 16 })
    .withMessage("Nomor telepon terlalu panjang (max 16 karakter)"),
  body("bio")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 3, max: 1000 })
    .withMessage("Bio harus berada di antara 3-1000 karakter"),
  body("country").optional({ values: "falsy" }).trim().toLowerCase(),
  body("city").optional({ values: "falsy" }).trim().toLowerCase(),
  body("address")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Alamat harus berada diantara 3-100 karakter"),
  body("gender")
    .optional({ values: "falsy" })
    .isIn(["male", "female", "blank"])
    .withMessage("Gender invalid"),
  body("dateOfBirth")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Format tanggal tidak valid"),
];

const addJsEducationRules = [
  body("institutionId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Format id institusi invalid"),

  body("institutionName")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Nama institut harus berada di antara 3-100 karakter"),

  body("fieldOfStudy")
    .notEmpty()
    .trim()
    .withMessage("Field yang dibutuhkan masih belum lengkap (fieldOfStudy)"),

  body("degree")
    .notEmpty()
    .trim()
    .withMessage("Field yang dibutuhkan masih belum lengkap (degree)"),

  body("score")
    .optional({ values: "falsy" })
    .isFloat({ min: 0, max: 100 })
    .withMessage("Nilai harus antara 0.00 - 100.00")
    .matches(/^\d{1,3}(\.\d{1,2})?$/)
    .withMessage(
      "Nilai hanya boleh memiliki maksimal 2 angka di belakang koma"
    ),

  body("startDate")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (startDate)")
    .isISO8601()
    .withMessage("Format tanggal tidak valid"),

  body("endDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Format tanggal tidak valid"),

  body("description")
    .optional({ values: "falsy" })
    .isLength({ min: 3, max: 300 })
    .withMessage("Deskripsi harus berada di antara 3-300 karakter"),

  body().custom((_, { req }) => {
    const { institutionId, institutionName, startDate, endDate } = req.body;

    if (!institutionId && !institutionName) {
      throw new Error("Field yang dibutuhkan masih belum lengkap");
    }
    if (institutionId && institutionName) {
      throw new Error("Institusi invalid");
    }
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      throw new Error("Tanggal selesai harus setelah tanggal mulai");
    }

    return true;
  }),
];
const addJsExperienceRules = [
  body("companyId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Format id perusahaan invalid"),

  body("companyName")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Nama perusahaan harus berada di antara 3-100 karakter"),

  body("experienceType")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isIn(["internship", "part-time", "full-time", "freelance", "contract"])
    .withMessage("Tipe pengalaman kerja tidak valid"),

  body("position")
    .notEmpty()
    .trim()
    .withMessage("Field yang dibutuhkan masih belum lengkap"),

  body("startDate")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isISO8601()
    .withMessage("Format tanggal tidak valid"),

  body("endDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Format tanggal tidak valid"),

  body("description")
    .optional({ values: "falsy" })
    .isLength({ min: 3, max: 300 })
    .withMessage("Deskripsi harus berada di antara 3-300 karakter"),

  body().custom((_, { req }) => {
    const { companyId, companyName, startDate, endDate } = req.body;

    if (!companyId && !companyName) {
      throw new Error("Field yang dibutuhkan masih belum lengkap");
    }
    if (companyId && companyName) {
      throw new Error("Perusahaan invalid");
    }
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      throw new Error("Tanggal selesai harus setelah tanggal mulai");
    }

    return true;
  }),
];
const addJsSkillRules = [
  body("skillId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Format id skill invalid"),

  body("skillName")
    .optional({ values: "falsy" })
    .trim()
    .toLowerCase()
    .isLength({ min: 3, max: 50 })
    .withMessage("Nama skill harus berada di antara 3-50 karakter"),

  body("description")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 3, max: 300 })
    .withMessage("Deskripsi harus berada di antara 3-300 karakter"),

  body().custom((_, { req }) => {
    const { skillId, skillName } = req.body;
    if (!skillId && !skillName) {
      throw new Error("Field yang dibutuhkan masih belum lengkap");
    }
    if (skillId && skillName) {
      throw new Error("Skill invalid");
    }
    return true;
  }),
];
const addJsDisabilityRules = [
  body("disabilityId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Format id disabilitas invalid"),

  body("disabilityName")
    .optional({ values: "falsy" })
    .trim()
    .toLowerCase()
    .isLength({ min: 3, max: 50 })
    .withMessage("Nama disabilitas harus berada di antara 3-50 karakter"),

  body("type")
    .optional({ values: "falsy" })
    .trim()
    .toLowerCase()
    .isIn([
      "sensory",
      "intellectual",
      "mental",
      "physical",
      "multiple",
      "other",
    ])
    .withMessage("Tipe disabilitas tidak valid"),

  body("description")
    .optional({ values: "falsy" })
    .isLength({ min: 3, max: 300 })
    .withMessage("Deskripsi harus berada di antara 3-300 karakter"),

  // CUSTOM RULE
  body().custom((_, { req }) => {
    const { disabilityId, disabilityName, type } = req.body;

    if (!disabilityId && !disabilityName) {
      throw new Error("Field yang dibutuhkan masih belum lengkap");
    }

    if (disabilityId && disabilityName) {
      throw new Error("Disabilitas invalid");
    }

    if (disabilityName && !type) {
      throw new Error(
        "Tipe disabilitas wajib jika mengirim nama disabilitas baru"
      );
    }

    return true;
  }),
];

module.exports = {
    jsProfileUpdateRules,
    addJsEducationRules,
    addJsExperienceRules,
    addJsSkillRules,
    addJsDisabilityRules,
}
