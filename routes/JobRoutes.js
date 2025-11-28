const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const validateMiddleware = require("../middlewares/validateMiddleware");
const ensureVerifiedAndActive = require("../middlewares/ensureVerifiedAndActive");
const {
  addJob,
  editJob,
  getJobById,
  getJobSkills,
  getJobDisabilities,
  applyJob,
  getJobApplications,
  addJobSkill,
  addJobDisability,
  deleteJobSkill,
  deleteJobDisability,
} = require("../controllers/JobController");
const {
  updateJobStatusRules,
  addJobRules,
  addJobSkillRules,
  addJobDisabilityRules,
  editJobRules,
} = require("../validators/JobValidator");
const checkJobOwner = require("../middlewares/checkJobOwner");

//add new job (company)
router.post(
  "/job",
  verifyToken(["company"]),
  ensureVerifiedAndActive,
  addJobRules,
  validateMiddleware,
  addJob
);

//add job skill
router.post(
  "/job/:jobId/skill",
  verifyToken(["company"]),
  ensureVerifiedAndActive,
  checkJobOwner,
  addJobSkillRules,
  validateMiddleware,
  addJobSkill
);
//add job disability
router.post(
  "/job/:jobId/disability",
  verifyToken(["company"]),
  ensureVerifiedAndActive,
  checkJobOwner,
  addJobDisabilityRules,
  validateMiddleware,
  addJobDisability
);
//delete job skill
router.delete(
  "/job/:jobId/skill/:id",
  verifyToken(["company"]),
  ensureVerifiedAndActive,
  checkJobOwner,
  deleteJobSkill
);
//delete job disability
router.delete(
  "/job/:jobId/disability/:id",
  verifyToken(["company"]),
  ensureVerifiedAndActive,
  checkJobOwner,
  deleteJobDisability
);

//get job by id
router.get("/job/:jobId", getJobById);
//get each job skills by id
router.get("/job/:jobId/skills", getJobSkills);
//get each job disabilities by id
router.get("/job/:jobId/disabilities", getJobDisabilities);
//get 
router.get("/job/:jobId/applications", getJobApplications)

//apply job
router.post(
  "/job/:jobId/apply",
  verifyToken(["job-seeker"]),
  ensureVerifiedAndActive,
  applyJob
);

//edit job (company)
router.put(
  "/job/:jobId",
  verifyToken(["company"]),
  ensureVerifiedAndActive,
  editJobRules,
  validateMiddleware,
  editJob
);

//update job status (company)
router.patch(
  "/job/:jobId/status",
  verifyToken(["company"]),
  ensureVerifiedAndActive,
  updateJobStatusRules,
  validateMiddleware
);

module.exports = router;
