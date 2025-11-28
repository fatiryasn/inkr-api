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
    .withMessage("Required fields are still incomplete (title)")
    .isLength({ max: 100 })
    .withMessage("Title is too long (max 100 characters)"),

  body("description")
    .notEmpty()
    .withMessage("Required fields are still incomplete (description)")
    .isLength({ min: 15, max: 5000 })
    .withMessage("Description must be in between 15-5000 characters"),

  body("employmentType")
    .notEmpty()
    .withMessage("Required fields are still incomplete (employmentType)")
    .isIn(["full-time", "part-time", "internship", "blank"])
    .withMessage("Employment type is invalid (employmentType)"),

  body("locationType")
    .notEmpty()
    .withMessage("Required fields are still incomplete (locationType)")
    .isIn(["on-site", "remote", "hybrid", "blank"])
    .withMessage("Location type is invalid (locationType)"),

  body("address")
    .if(body("locationType").equals("on-site"))
    .notEmpty()
    .withMessage("Address is required for on-site job.")
    .isLength({ max: 100 })
    .withMessage("Address is too long (max 100 characters)"),

  body("minSalary")
    .optional({ values: "falsy" })
    .isFloat({ min: 0 })
    .withMessage("Invalid minimum salary format"),

  body("maxSalary")
    .optional({ values: "falsy" })
    .isFloat({ min: 0 })
    .withMessage("Invalid maximum salary format")
    .custom((value, { req }) => {
      if (
        req.body.minSalary !== undefined &&
        req.body.minSalary !== "" &&
        parseFloat(value) <= parseFloat(req.body.minSalary)
      ) {
        throw new Error("Maximum salary must be greater than minimum salary");
      }
      return true;
    }),

  body("startDate")
    .notEmpty()
    .withMessage("Required fields are still incomplete (startDate)")
    .custom((value) => {
      if (!moment(value, "YYYY-MM-DD", true).isValid()) {
        throw new Error("Invalid start date format (YYYY-MM-DD)");
      }
      const today = moment().startOf("day");
      const start = moment(value, "YYYY-MM-DD");
      if (start.isBefore(today))
        throw new Error("Start date cannot be less than today");
      return true;
    }),

  body("endDate")
    .notEmpty()
    .withMessage("Required fields are still incomplete (endDate)")
    .custom((value, { req }) => {
      if (!moment(value, "YYYY-MM-DD", true).isValid()) {
        throw new Error("Invalid end date format (YYYY-MM-DD)");
      }
      const today = moment().startOf("day");
      const end = moment(value, "YYYY-MM-DD");
      if (end.isBefore(today))
        throw new Error("End date cannot be less than today");
      if (req.body.startDate) {
        const start = moment(req.body.startDate, "YYYY-MM-DD");
        if (end.isBefore(start))
          throw new Error("End date cannot be less than start date");
      }
      return true;
    }),

  body("skills")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Invalid skills format (Array expected)")
    .bail()
    .custom((arr) => {
      if (arr.length > 50) throw new Error("Too many skills (max 50)");
      for (const item of arr) {
        if (!item || typeof item !== "object")
          throw new Error("Invalid skill item (Object expected)");

        const hasId = item.id !== undefined && item.id !== null;
        const hasName =
          item.name !== undefined &&
          item.name !== null &&
          String(item.name).trim() !== "";

        if (!hasId && !hasName) {
          throw new Error("Each skill must have an ID or name.");
        }
        if (hasId && hasName) {
          throw new Error("Skills cannot send ID and name at the same time");
        }

        if (hasId) {
          if (!Number.isInteger(item.id) || item.id <= 0) {
            throw new Error(
              "Invalid skill id if provided (Positive integer expected)"
            );
          }
        } else {
          if (typeof item.name !== "string" || !item.name.trim()) {
            throw new Error("Skill name is required if ID is not included");
          }
          if (item.name.length > 100) {
            throw new Error("Skill name is too long (max 100 karakter)");
          }
        }
      }
      return true;
    }),

  body("disabilities")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Invalid disabilities format (Array expected)")
    .bail()
    .custom((arr) => {
      if (arr.length > 50) throw new Error("Too many disabilities (max 50)");

      for (const item of arr) {
        if (!item || typeof item !== "object")
          throw new Error("Invalid disability item (Object expected)");

        const hasId = item.id !== undefined && item.id !== null;
        const hasName = item.name && String(item.name).trim() !== "";
        const hasType = item.type && String(item.type).trim() !== "";

        //id given
        if (hasId) {
          if (hasName || hasType)
            throw new Error("Disabilities cannot send ID along with name/type");

          if (!Number.isInteger(item.id) || item.id <= 0)
            throw new Error(
              "Invalid disability id (Positive integer expected)"
            );

          continue;
        }

        //name / type given
        if (!hasName)
          throw new Error("Disability name is required if ID is not included");
        if (typeof item.name !== "string" || item.name.length > 100)
          throw new Error("Disability name invalid (max 100 chars)");

        if (!hasType)
          throw new Error("Disability type is required if ID is not included");
        if (typeof item.type !== "string" || item.type.length > 50)
          throw new Error("Disability type invalid (max 50 chars)");

        if (!VALID_DISABILITY_TYPES.includes(item.type)) {
          throw new Error(
            `Disability type must be one of: ${VALID_DISABILITY_TYPES.join(
              ", "
            )}`
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
    .withMessage("Skill ID is invalid"),

  body("skillName")
    .optional({ values: "falsy" })
    .trim()
    .toLowerCase()
    .isLength({ min: 3 })
    .withMessage("skillName is too short (min 3 characters)"),

  body().custom((_, { req }) => {
    const { skillId, skillName } = req.body;
    if (!skillId && !skillName) {
      throw new Error("Required fields are still incomplete");
    }
    if (skillId && skillName) {
      throw new Error("Cant send both id and name");
    }
    return true;
  }),
];

const addJobDisabilityRules = [
  body("disabilityId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Disability ID is invalid"),

  body("disabilityName")
    .optional({ values: "falsy" })
    .trim()
    .toLowerCase()
    .isLength({ min: 3 })
    .withMessage("disabilityName is too short"),

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
    .withMessage("Disability type is invalid"),

  // CUSTOM RULE
  body().custom((_, { req }) => {
    const { disabilityId, disabilityName, type } = req.body;

    if (!disabilityId && !disabilityName) {
      throw new Error("Required fields are still incomplete");
    }

    if (disabilityId && (disabilityName || type)) {
      throw new Error("Cant send both id and name+type");
    }

    if (disabilityName && !type) {
      throw new Error(
        "Type is required for new disability name"
      );
    }

    return true;
  }),
];

const editJobRules = [
  body("title")
    .optional({ values: "falsy" })
    .isLength({ max: 100 })
    .withMessage("Title is too long (max 100 characters)"),

  body("description")
    .optional({ values: "falsy" })
    .isLength({ min: 15, max: 5000 })
    .withMessage("Description must be in between 15-5000 characters"),

  body("employmentType")
    .optional({ values: "falsy" })
    .isIn(["full-time", "part-time", "internship", "blank"])
    .withMessage("Employment type is invalid (employmentType)"),

  body("locationType")
    .optional({ values: "falsy" })
    .isIn(["on-site", "remote", "hybrid", "blank"])
    .withMessage("Location type is invalid (locationType)"),

  body("address")
    .if(body("locationType").equals("on-site"))
    .notEmpty()
    .withMessage("Address is required for on-site job.")
    .isLength({ max: 100 })
    .withMessage("Address is too long (max 100 characters)"),

  body("minSalary")
    .optional({ values: "falsy" })
    .isFloat({ min: 0 })
    .withMessage("Invalid minimum salary format"),

  body("maxSalary")
    .optional({ values: "falsy" })
    .isFloat({ min: 0 })
    .withMessage("Invalid maximum salary format")
    .custom((value, { req }) => {
      if (
        req.body.minSalary !== undefined &&
        req.body.minSalary !== "" &&
        parseFloat(value) <= parseFloat(req.body.minSalary)
      ) {
        throw new Error("Maximum salary must be greater than minimum salary");
      }
      return true;
    }),
];

const updateJobStatusRules = [
  body("status")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isIn(["pending", "open", "closed", "cancelled"])
    .withMessage("Status tidak valid"),
];

module.exports = {
  addJobRules,
  addJobSkillRules,
  addJobDisabilityRules,
  updateJobStatusRules,
  editJobRules,
};
