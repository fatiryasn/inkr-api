const router = require("express").Router();
const { body } = require("express-validator");
const {
  getUserById,
  updateUsername,
  updateProfilePicture,
} = require("../controllers/UserController");
const verifyToken = require("../middlewares/verifyToken");
const validateMiddleware = require("../middlewares/validateMiddleware");
const ensureVerifiedAndActive = require("../middlewares/ensureVerifiedAndActive");
const upload = require("../utils/multer");

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


//get user by id
router.get("/user/:userId", getUserById);

//update username
router.patch(
  "/user/update-username",
  verifyToken(),
  ensureVerifiedAndActive,
  updateUsernameRules,
  validateMiddleware,
  updateUsername
);

//update profile picture
router.patch(
  "/user/update-profile-picture",
  verifyToken(),
  ensureVerifiedAndActive,
  upload.single("profilePicture"),
  updateProfilePicture
)

module.exports = router;