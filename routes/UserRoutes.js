const router = require("express").Router();
const {
  getUserById,
  updateUsername,
  updateProfilePicture,
} = require("../controllers/UserController");
const verifyToken = require("../middlewares/verifyToken");
const validateMiddleware = require("../middlewares/validateMiddleware");
const ensureVerifiedAndActive = require("../middlewares/ensureVerifiedAndActive");
const upload = require("../utils/multer");
const { updateUsernameRules } = require("../validators/UserValidator");




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