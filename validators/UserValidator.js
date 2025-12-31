const { body } = require("express-validator");

const addAdminRules = [
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
    .isLength({ min: 3, max: 100 })
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

  body("role")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (role)")
    .isIn(["admin", "super-admin"])
    .withMessage("Role user invalid"),
];

const updateUsernameRules = [
  body("username")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isAlphanumeric()
    .withMessage("Username hanya boleh berisi huruf dan angka")
    .isLength({ min: 3, max: 20 })
    .withMessage("Username harus berada di antara 3-20 karakter"),
];

const suspendUserRules = [
  body("type")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (type)")
    .isIn(["temporary", "permanent"])
    .withMessage("Type suspend harus temporary atau permanent"),

  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (reason)")
    .isLength({ min: 3, max: 300 })
    .withMessage("Alasan harus berada di antara 3-300 karakter"),

  body("suspendUntil")
    .optional({ values: "falsy" })
    .custom((value, { req }) => {
      if (req.body.type === "temporary") {
        if (!value) {
          throw new Error(
            "Tanggal akhir suspend harus diisi untuk suspend temporal"
          );
        }

        const suspendUntilDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (suspendUntilDate <= today) {
          throw new Error("Tanggal akhir suspend harus lebih dari hari ini");
        }
      }
      return true;
    })
    .isISO8601()
    .withMessage("Format tanggal tidak valid")
    .toDate(),
];
const unsuspendUserRules = [
  body("unsuspendReason")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (unsuspendReason)")
    .isLength({ min: 3, max: 300 })
    .withMessage("Alasan harus berada di antara 3-300 karakter"),
];

const updateRegistrationRules = [
  body("status")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (status)")
    .isIn(["approved", "rejected"])
    .withMessage("Tipe status registrasi tidak valid"),

  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap (reason)")
    .isLength({ min: 3, max: 300 })
    .withMessage("Alasan harus berada di antara 3-300 karakter"),
];

module.exports = {
  addAdminRules,
  updateUsernameRules,
  suspendUserRules,
  unsuspendUserRules,
  updateRegistrationRules,
};
