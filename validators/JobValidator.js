const { body } = require("express-validator");
const moment = require("moment");

const VALID_DISABILITY_TYPES = [
  "sensory",
  "intellectual",
  "mental",
  "physical",
  "multiple",
  "other",
];

const addJobRules = [
  body("title")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (title)")
    .isLength({ min: 3, max: 100 })
    .withMessage("Title harus berada di antara 3-100 karakter"),

  body("description")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (description)")
    .isLength({ min: 15, max: 5000 })
    .withMessage("Deskripsi harus berada di antara 15-5000 karakter"),

  body("employmentType")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (employmentType)")
    .isIn(["full-time", "part-time", "internship", "blank"])
    .withMessage("Tipe pekerjaan invalid (employmentType)"),

  body("locationType")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (locationType)")
    .isIn(["on-site", "remote", "hybrid", "blank"])
    .withMessage("Tipe lokasi invalid (locationType)"),

  body("address")
    .if(body("locationType").equals("on-site"))
    .notEmpty()
    .withMessage("Alamat wajib disertakan jika tipe lokasi adalah on-site")
    .isLength({ min: 3, max: 100 })
    .withMessage("Alamat harus berada di antara 3-100 karakter"),

  body("minSalary")
    .optional({ values: "falsy" })
    .isFloat({ min: 0 })
    .withMessage("Nominal gaji invalid"),

  body("maxSalary")
    .optional({ values: "falsy" })
    .isFloat({ min: 0 })
    .withMessage("Nominal gaji invalid")
    .custom((value, { req }) => {
      if (
        req.body.minSalary !== undefined &&
        req.body.minSalary !== "" &&
        parseFloat(value) <= parseFloat(req.body.minSalary)
      ) {
        throw new Error(
          "Maksimum gaji harus lebih besar daripada minimal gaji"
        );
      }
      return true;
    }),

  body("startDate")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (startDate)")
    .custom((value) => {
      if (!moment(value, "YYYY-MM-DD", true).isValid()) {
        throw new Error("Tanggal mulai invalid (YYYY-MM-DD)");
      }
      const today = moment().startOf("day");
      const start = moment(value, "YYYY-MM-DD");
      if (start.isBefore(today))
        throw new Error(
          "Tanggal mulai minimal adalah hari ini atau setelahnya"
        );
      return true;
    }),

  body("endDate")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (endDate)")
    .custom((value, { req }) => {
      if (!moment(value, "YYYY-MM-DD", true).isValid()) {
        throw new Error("Tanggal berakhir invalid (YYYY-MM-DD)");
      }
      const tomorrow = moment().add(1, "day").startOf("day");
      const end = moment(value, "YYYY-MM-DD");
      if (end.isBefore(tomorrow))
        throw new Error("Tanggal akhir minimal adalah besok atau setelahnya");
      if (req.body.startDate) {
        const start = moment(req.body.startDate, "YYYY-MM-DD");
        if (!end.isAfter(start))
          throw new Error("Tanggal akhir harus setelah tanggal awal");
      }
      return true;
    }),

  body("skills")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Skill format invalid (Array expected)")
    .bail()
    .custom((arr) => {
      if (arr.length > 20)
        throw new Error("Maksimum skill hanya bisa 20 (max 20)");
      for (const item of arr) {
        if (!item || typeof item !== "object")
          throw new Error("Skill item invalid (Object expected)");

        const hasId = Number.isInteger(item.id) && item.id > 0;
        const hasName =
          item.name !== undefined &&
          item.name !== null &&
          String(item.name).trim() !== "";

        if (!hasId && !hasName) {
          throw new Error("Tiap skill wajib menyertakan id atau nama");
        }

        if (hasId) {
          if (!Number.isInteger(item.id) || item.id <= 0) {
            throw new Error("Skill id invalid (Positive integer expected)");
          }
        } else {
          if (typeof item.name !== "string" || !item.name.trim()) {
            throw new Error(
              "Nama skill wajib disertakan bila tidak ada id skill"
            );
          }
          if (item.name.length < 3 || item.name.length > 50) {
            throw new Error("Nama skill harus berada di antara 3-50 karakter");
          }
        }
      }
      return true;
    }),

  body("disabilities")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Disability format invalid (Array expected)")
    .bail()
    .custom((arr) => {
      if (arr.length > 20)
        throw new Error("Maksimum disabilitas hanya bisa 20 (max 20)");

      for (const item of arr) {
        if (!item || typeof item !== "object")
          throw new Error("Disability item invalid (Object expected)");

        const hasId = Number.isInteger(item.id) && item.id > 0;
        const hasName = item.name && String(item.name).trim() !== "";
        const hasType = item.type && String(item.type).trim() !== "";

        //id given
        if (hasId) {
          if (!Number.isInteger(item.id) || item.id <= 0)
            throw new Error(
              "Disability id invalid (Positive integer expected)"
            );

          continue;
        }
        //name / type given
        if (typeof item.name !== "string" || !hasName) {
          throw new Error(
            "Nama disabilitas wajib disertakan bila tidak ada id disabilitas"
          );
        }
        if (item.name.length < 3 || item.name.length > 50) {
          throw new Error(
            "Nama disabilitas harus berada di antara 3-50 karakter"
          );
        }
        if (!hasType) {
          throw new Error(
            "Tipe disabilitas wajib disertakan bila tidak ada id disabilitas"
          );
        }

        if (!VALID_DISABILITY_TYPES.includes(item.type)) {
          throw new Error(
            `Tipe disabilitas invalid (valid:  ${VALID_DISABILITY_TYPES.join(
              ", "
            )})`
          );
        }
      }
      return true;
    }),
];
const addJobSkillRules = [
  body("skillId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("ID skill invalid"),

  body("skillName")
    .optional({ values: "falsy" })
    .trim()
    .toLowerCase()
    .isLength({ min: 3, max: 50 })
    .withMessage("Nama skill harus berada di antara 3-50 karakter"),

  body().custom((_, { req }) => {
    const { skillId, skillName } = req.body;
    if (!skillId && !skillName) {
      throw new Error("Field yang dibutuhkan masih belum lengkap");
    }
    return true;
  }),
];
const addJobDisabilityRules = [
  body("disabilityId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("ID disabilitas invalid"),

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
    .withMessage("Tipe disabilitas invalid"),

  // CUSTOM RULE
  body().custom((_, { req }) => {
    const { disabilityId, disabilityName, type } = req.body;

    if (!disabilityId && !disabilityName) {
      throw new Error("Field yang dibutuhkan masih belum lengkap");
    }

    if (disabilityName && !type) {
      throw new Error("Tipe disabilitas wajib disertakan");
    }

    return true;
  }),
];
const editJobRules = [
  body("title")
    .optional({ values: "falsy" })
    .isLength({ min: 3, max: 100 })
    .withMessage("Title harus berada di antara 3-100 karakter"),

  body("description")
    .optional({ values: "falsy" })
    .isLength({ min: 15, max: 2000 })
    .withMessage("Deskripsi harus berada di antara 15-2000"),

  body("employmentType")
    .optional({ values: "falsy" })
    .isIn(["full-time", "part-time", "internship", "blank"])
    .withMessage("Tipe pekerjaan invalid (employmentType)"),

  body("locationType")
    .optional({ values: "falsy" })
    .isIn(["on-site", "remote", "hybrid", "blank"])
    .withMessage("Tipe lokasi invalid (locationType)"),

  body("address")
    .if(body("locationType").equals("on-site"))
    .notEmpty()
    .withMessage("Alamat wajib disertakan jika tipe lokasi adalah on-site")
    .isLength({ min: 3, max: 100 })
    .withMessage("Alamat harus berada di antara 3-100 karakter"),

  body("minSalary")
    .optional({ values: "falsy" })
    .isFloat({ min: 0 })
    .withMessage("Nominal gaji invalid"),

  body("maxSalary")
    .optional({ values: "falsy" })
    .isFloat({ min: 0 })
    .withMessage("Nominal gaji invalid")
    .custom((value, { req }) => {
      if (
        req.body.minSalary !== undefined &&
        req.body.minSalary !== "" &&
        parseFloat(value) <= parseFloat(req.body.minSalary)
      ) {
        throw new Error(
          "Maksimum gaji harus lebih besar daripada minimal gaji"
        );
      }
      return true;
    }),
];

const updateJobStatusRules = [
  body("status")
    .notEmpty()
    .toLowerCase()
    .withMessage("Field yang dibutuhkan masih belum lengkap (status)")
    .isIn(["pending", "open", "closed", "cancelled"])
    .withMessage("Status tidak valid"),
  body("endDate")
    .optional({ values: "falsy" })
    .custom((value, { req }) => {
      if (!moment(value, "YYYY-MM-DD", true).isValid()) {
        throw new Error("Tanggal berakhir invalid (YYYY-MM-DD)");
      }
      const tomorrow = moment().add(1, "day").startOf("day");
      const end = moment(value, "YYYY-MM-DD");
      if (end.isBefore(tomorrow))
        throw new Error("Tanggal akhir minimal adalah besok atau setelahnya");
      return true;
    }),
];
const rescheduleJobRules = [
  body("startDate")
    .optional({ values: "falsy" })
    .custom((value) => {
      if (!moment(value, "YYYY-MM-DD", true).isValid()) {
        throw new Error("Tanggal mulai invalid (YYYY-MM-DD)");
      }
      const today = moment().startOf("day");
      const start = moment(value, "YYYY-MM-DD");
      if (start.isBefore(today))
        throw new Error("Tanggal mulai minimal adalah hari ini atau setelahnya");
      return true;
    }),

  body("endDate")
    .optional({ values: "falsy" })
    .custom((value, { req }) => {
      if (!moment(value, "YYYY-MM-DD", true).isValid()) {
        throw new Error("Tanggal berakhir invalid (YYYY-MM-DD)");
      }
      const tomorrow = moment().add(1, "day").startOf("day");
      const end = moment(value, "YYYY-MM-DD");
      if (end.isBefore(tomorrow))
        throw new Error("Tanggal akhir minimal adalah besok atau setelahnya");
      if (req.body.startDate) {
        const start = moment(req.body.startDate, "YYYY-MM-DD");
        if (!end.isAfter(start))
          throw new Error("Tanggal akhir harus setelah tanggal awal");
      }
      return true;
    }),
];

const applyJobRules = [
  body("message")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 3, max: 1000 })
    .withMessage("Pesan harus berada di antara 3-1000 karakter"),
  body("portofolioLink")
    .optional({ values: "falsy" })
    .isLength({ min: 3, max: 300 })
    .withMessage("Link eksternal harus berada di antara 3-300 karakter")
    .isURL()
    .withMessage("Format URL tidak valid"),
];
const updateApplicationStatusRules = [
  body("status")
    .notEmpty()
    .toLowerCase()
    .withMessage("Field yang dibutuhkan masih belum lengkap (status)")
    .isIn(["reviewed", "accepted", "rejected", "withdrawn"])
    .withMessage("Status tidak valid"),
  body("companyMessage")
    .optional({ values: "falsy" })
    .isLength({ min: 3, max: 1000 })
    .withMessage("Pesan harus berada di antara 3-1000 karakter"),
  body("companyExternalLink")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 3, max: 300 })
    .withMessage("Link eksternal harus berada di antara 3-300 karakter")
    .isURL()
    .withMessage("Format URL tidak valid"),
];

module.exports = {
  addJobRules,
  addJobSkillRules,
  addJobDisabilityRules,
  updateJobStatusRules,
  editJobRules,
  rescheduleJobRules,
  applyJobRules,
  updateApplicationStatusRules,
};
