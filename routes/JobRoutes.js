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
  getJobs,
  updateJobStatus,
  rescheduleJob,
  updateApplicationStatus,
} = require("../controllers/JobController");
const {
  updateJobStatusRules,
  addJobRules,
  addJobSkillRules,
  addJobDisabilityRules,
  editJobRules,
  rescheduleJobRules,
  applyJobRules,
  updateApplicationStatusRules,
} = require("../validators/JobValidator");
const checkJobOwner = require("../middlewares/checkJobOwner");
const optionalAuth = require("../middlewares/optionalAuth");

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

//get jobs
router.get("/jobs", getJobs)
//get job by id
router.get("/job/:jobId", optionalAuth, getJobById);
//get each job skills by id
router.get("/job/:jobId/skills", getJobSkills);
//get each job disabilities by id
router.get("/job/:jobId/disabilities", getJobDisabilities);
//get each job applications by id
router.get("/job/:jobId/applications", getJobApplications)

//apply job
router.post(
  "/job/:jobId/apply",
  verifyToken(["job-seeker"]),
  ensureVerifiedAndActive,
  applyJobRules,
  validateMiddleware,
  applyJob
);
//update application status
router.patch(
  "/job/:jobId/application/:appId/status",
  verifyToken(["company"]),
  ensureVerifiedAndActive,
  checkJobOwner,
  updateApplicationStatusRules,
  validateMiddleware,
  updateApplicationStatus
)

//edit job (company)
router.put(
  "/job/:jobId",
  verifyToken(["company"]),
  ensureVerifiedAndActive,
  checkJobOwner,
  editJobRules,
  validateMiddleware,
  editJob
);

//update job status (company)
router.patch(
  "/job/:jobId/status",
  verifyToken(["company"]),
  ensureVerifiedAndActive,
  checkJobOwner,
  updateJobStatusRules,
  validateMiddleware,
  updateJobStatus
);

//reschedule job
router.patch(
  "/job/:jobId/reschedule",
  verifyToken(["company"]),
  ensureVerifiedAndActive,
  checkJobOwner,
  rescheduleJobRules,
  validateMiddleware,
  rescheduleJob
)

module.exports = router;
