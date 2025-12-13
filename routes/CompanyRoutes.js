const verifyToken = require("../middlewares/verifyToken");
const validateMiddleware = require("../middlewares/validateMiddleware");
const ensureVerifiedAndActive = require("../middlewares/ensureVerifiedAndActive");
const { cmProfileUpdate, getCompanies, getCompanyJobs, getCompanyApplication } = require("../controllers/CompanyController");
const { cmProfileUpdateRules } = require("../validators/CompanyValidator");
const router = require("express").Router();


//get companies
router.get('/companies', getCompanies)

//get company's jobs
router.get('/company-jobs', verifyToken(["company"]), ensureVerifiedAndActive, getCompanyJobs)

//get company's jobs
router.get('/company-applications', verifyToken(["company"]), ensureVerifiedAndActive, getCompanyApplication)

//update company profile
router.put(
  "/user/cm/profile",
  verifyToken(["company"]),
  ensureVerifiedAndActive,
  cmProfileUpdateRules,
  validateMiddleware,
  cmProfileUpdate
);

module.exports = router