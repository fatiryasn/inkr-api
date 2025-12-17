const {
  getIndustries,
  getDisabilities,
  getSkills,
  getOtherUserPreviews,
  getOtherJobPreviews,
  getCompanyOverviewStats,
  getJsApplicationStats,
} = require("../controllers/DataController");
const optionalAuth = require("../middlewares/optionalAuth");
const verifyToken = require("../middlewares/verifyToken");

const router = require("express").Router();

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
)

module.exports = router;
