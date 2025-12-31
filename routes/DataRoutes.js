const {
  getIndustries,
  getDisabilities,
  getSkills,
  getOtherUserPreviews,
  getOtherJobPreviews,
  getCompanyOverviewStats,
  getJsApplicationStats,
  getUserStats,
  getDictionaries,
  addNewDictionary,
  deleteDictionary,
  getDashboardStats,
} = require("../controllers/DataController");
const ensureVerifiedAndActive = require("../middlewares/ensureVerifiedAndActive");
const optionalAuth = require("../middlewares/optionalAuth");
const validateMiddleware = require("../middlewares/validateMiddleware");
const verifyToken = require("../middlewares/verifyToken");
const { addDictionaryRules } = require("../validators/DataValidators");

const router = require("express").Router();

router.get(
  "/dictionaries",
  verifyToken(["admin", "super-admin"]),
  ensureVerifiedAndActive,
  getDictionaries
);

router.post(
  "/dictionary",
  verifyToken(["admin", "super-admin"]),
  ensureVerifiedAndActive,
  addDictionaryRules,
  validateMiddleware,
  addNewDictionary
);

router.delete(
  "/dictionary/:type/:id",
  verifyToken(["admin", "super-admin"]),
  ensureVerifiedAndActive,
  deleteDictionary
)

router.get("/industries", getIndustries);

router.get("/disabilities", getDisabilities);

router.get("/skills", getSkills);

router.get("/other-user-preview", optionalAuth, getOtherUserPreviews);

router.get("/other-job-preview", optionalAuth, getOtherJobPreviews);

router.get(
  "/company-overview",
  verifyToken(["company"]),
  getCompanyOverviewStats
);

router.get(
  "/js-application-stats",
  verifyToken(["job-seeker"]),
  getJsApplicationStats
);

router.get("/dashboard-stats", verifyToken(["admin", "super-admin"]), getDashboardStats)

router.get("/user-stats", verifyToken(["admin", "super-admin"]), getUserStats);

module.exports = router;
