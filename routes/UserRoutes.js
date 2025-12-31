const router = require("express").Router();
const {
  getUserById,
  updateUsername,
  updateProfilePicture,
  getUsers,
  getRegisterRequests,
  getRegisterRequestByRQS,
  updateRegistrationStatus,
  suspendUser,
  getSuspends,
  unsuspendUser,
  getSuspendBySPD,
  getAdmins,
  addNewAdmin,
} = require("../controllers/UserController");
const verifyToken = require("../middlewares/verifyToken");
const validateMiddleware = require("../middlewares/validateMiddleware");
const ensureVerifiedAndActive = require("../middlewares/ensureVerifiedAndActive");
const upload = require("../utils/multer");
const {
  updateUsernameRules,
  updateRegistrationRules,
  suspendUserRules,
  unsuspendUserRules,
  addAdminRules,
} = require("../validators/UserValidator");
const optionalAuth = require("../middlewares/optionalAuth");

//get users (admin)
router.get("/users", verifyToken(["admin", "super-admin"]), ensureVerifiedAndActive, getUsers);

//get user by id
router.get("/user/:userId", optionalAuth, getUserById);

//get admins (super-admin)
router.get(
  "/users/admin",
  verifyToken(["super-admin"]),
  ensureVerifiedAndActive,
  getAdmins
);

//create new admin (super-admin)
router.post(
  "/user/admin",
  verifyToken(["super-admin"]),
  ensureVerifiedAndActive,
  addAdminRules,
  validateMiddleware,
  addNewAdmin
);

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
);

//get suspends
router.get(
  "/users/suspend",
  verifyToken(["admin",, "super-admin"]),
  ensureVerifiedAndActive,
  getSuspends
);

//get suspend by SPD
router.get(
  "/user/suspend/:spdCode",
  verifyToken(["admin", "super-admin"]),
  ensureVerifiedAndActive,
  getSuspendBySPD
);

//suspend user (admin)
router.patch(
  "/user/:userId/suspend",
  verifyToken(["admin", "super-admin"]),
  ensureVerifiedAndActive,
  suspendUserRules,
  validateMiddleware,
  suspendUser
);

//unsuspend user (admin)
router.patch(
  "/user/:userId/unsuspend",
  verifyToken(["admin", "super-admin"]),
  ensureVerifiedAndActive,
  unsuspendUserRules,
  validateMiddleware,
  unsuspendUser
);

//get requested users
router.get(
  "/users/requested",
  verifyToken(["admin", "super-admin"]),
  ensureVerifiedAndActive,
  getRegisterRequests
);

//get requested user by RQS Code
router.get(
  "/user/requested/:rqsCode",
  verifyToken(["admin", "super-admin"]),
  ensureVerifiedAndActive,
  getRegisterRequestByRQS
);

//update registration status
router.patch(
  "/user/:userId/requested/:rqsCode",
  verifyToken(["admin", "super-admin"]),
  ensureVerifiedAndActive,
  updateRegistrationRules,
  validateMiddleware,
  updateRegistrationStatus
);

module.exports = router;
