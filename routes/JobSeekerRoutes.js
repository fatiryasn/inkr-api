const verifyToken = require("../middlewares/verifyToken");
const validateMiddleware = require("../middlewares/validateMiddleware");
const ensureVerifiedAndActive = require("../middlewares/ensureVerifiedAndActive");
const {
  jsProfileUpdate,
  addJsEducation,
  addJsExperience,
  addJsSkill,
  addJsDisability,
  deleteJsDisability,
  deleteJsEducation,
  deleteJsExperience,
  deleteJsSkill,
  getJsEducations,
  getJsExperiences,
  getJsDisabilities,
  getJsSkills,
} = require("../controllers/JobSeekerController");
const { jsProfileUpdateRules, addJsEducationRules, addJsExperienceRules, addJsSkillRules, addJsDisabilityRules } = require("../validators/JobSeekerValidator");
const router = require("express").Router();



//get job seeker educations
router.get("/user/js/:userId/educations", getJsEducations);

//get job seeker experiences
router.get("/user/js/:userId/experiences", getJsExperiences);

//get job seeker skills
router.get("/user/js/:userId/skills", getJsSkills);

//get job seeker disabilities
router.get("/user/js/:userId/disabilities", getJsDisabilities);

//update job seeker profile
router.put(
  "/user/js/profile",
  verifyToken(["job-seeker"]),
  ensureVerifiedAndActive,
  jsProfileUpdateRules,
  validateMiddleware,
  jsProfileUpdate
);

//add job seeker education
router.post(
  "/user/js/education",
  verifyToken(["job-seeker"]),
  ensureVerifiedAndActive,
  addJsEducationRules,
  validateMiddleware,
  addJsEducation
);

//add job seeker experience
router.post(
  "/user/js/experience",
  verifyToken(["job-seeker"]),
  ensureVerifiedAndActive,
  addJsExperienceRules,
  validateMiddleware,
  addJsExperience
);

//add job seeker skill
router.post(
  "/user/js/skill",
  verifyToken(["job-seeker"]),
  ensureVerifiedAndActive,
  addJsSkillRules,
  validateMiddleware,
  addJsSkill
);

//add job seeker disability
router.post(
  "/user/js/disability",
  verifyToken(["job-seeker"]),
  ensureVerifiedAndActive,
  addJsDisabilityRules,
  validateMiddleware,
  addJsDisability
);

//delete job seeker education
router.delete(
  "/user/js/education/:detailId",
  verifyToken(["job-seeker"]),
  ensureVerifiedAndActive,
  deleteJsEducation
);

//delete job seeker experience
router.delete(
  "/user/js/experience/:detailId",
  verifyToken(["job-seeker"]),
  ensureVerifiedAndActive,
  deleteJsExperience
);

//delete job seeker skill
router.delete(
  "/user/js/skill/:detailId",
  verifyToken(["job-seeker"]),
  ensureVerifiedAndActive,
  deleteJsSkill
);

//delete job seeker disability
router.delete(
  "/user/js/disability/:detailId",
  verifyToken(["job-seeker"]),
  ensureVerifiedAndActive,
  deleteJsDisability
);

module.exports = router;
