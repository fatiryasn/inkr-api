const verifyToken = require("../middlewares/verifyToken");
const validateMiddleware = require("../middlewares/validateMiddleware");
const ensureVerifiedAndActive = require("../middlewares/ensureVerifiedAndActive");
const {
  cmProfileUpdate,
  getCompanies,
  getCompanyJobs,
  getCompanyApplication,
  getJsApplicationPreview,
} = require("../controllers/CompanyController");
const { cmProfileUpdateRules } = require("../validators/CompanyValidator");
const router = require("express").Router();

//get companies
router.get("/companies", getCompanies);

//get company's jobs
router.get(
  "/user/cm/jobs",
  verifyToken(["company"]),
  ensureVerifiedAndActive,
  getCompanyJobs
);
//get company's applications
router.get(
  "/user/cm/applications",
  verifyToken(["company"]),
  ensureVerifiedAndActive,
  getCompanyApplication
);

//get js application preview
router.get(
  "/user/cm/:jsId/js-preview-applications",
  verifyToken(["company"]),
  ensureVerifiedAndActive,
  getJsApplicationPreview
);

//update company profile
router.put(
  "/user/cm/profile",
  verifyToken(["company"]),
  ensureVerifiedAndActive,
  cmProfileUpdateRules,
  validateMiddleware,
  cmProfileUpdate
);

module.exports = router;
