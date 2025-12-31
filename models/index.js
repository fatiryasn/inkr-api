const sequelize = require("../config/database");

const Disability = require("./databank-cluster/Disability");
const Industry = require("./databank-cluster/Industry");
const Skill = require("./databank-cluster/Skill");

const Job = require("./job-cluster/Job");
const JobApplication = require("./job-cluster/JobApplication");
const JobDisability = require("./job-cluster/JobDisability");
const JobSkill = require("./job-cluster/JobSkill");

const Company = require("./user-cluster/Company");
const RegisterRequest = require("./user-cluster/RegisterRequest");
const User = require("./user-cluster/User");
const UserDisability = require("./user-cluster/UserDisability");
const UserEducation = require("./user-cluster/UserEducation");
const UserExperience = require("./user-cluster/UserExperience");
const UserProfile = require("./user-cluster/UserProfile");
const UserSkill = require("./user-cluster/UserSkills");
const UserSuspend = require("./user-cluster/UserSuspend");

/*
    USER
 */
//user to user_profile CASCADE one to one
User.hasOne(UserProfile, { foreignKey: "userId", onDelete: "CASCADE" });
UserProfile.belongsTo(User, { foreignKey: "userId" });

//user to user_experience CASCADE one to many
User.hasMany(UserExperience, { foreignKey: "userId", onDelete: "CASCADE" });
UserExperience.belongsTo(User, { foreignKey: "userId" });

//user to user_education CASCADE one to many
User.hasMany(UserEducation, { foreignKey: "userId", onDelete: "CASCADE" });
UserEducation.belongsTo(User, { foreignKey: "userId" });

//user to user_disability CASCADE one to many
User.hasMany(UserDisability, { foreignKey: "userId", onDelete: "CASCADE" });
UserDisability.belongsTo(User, { foreignKey: "userId" });

//user to user_skill CASCADE one to many
User.hasMany(UserSkill, { foreignKey: "userId", onDelete: "CASCADE" });
UserSkill.belongsTo(User, { foreignKey: "userId" });

//user to company CASCADE one to one
User.hasOne(Company, { foreignKey: "userId", onDelete: "CASCADE" });
Company.belongsTo(User, { foreignKey: "userId" });

//user to job_application CASCADE one to many
User.hasMany(JobApplication, { foreignKey: "userId", onDelete: "CASCADE" });
JobApplication.belongsTo(User, { foreignKey: "userId" });

//user to register_request CASCADE one to one
User.hasOne(RegisterRequest, { foreignKey: "userId", onDelete: "CASCADE" });
RegisterRequest.belongsTo(User, { foreignKey: "userId" });

//user (admin) to register_request SET NULL one to many
User.hasMany(RegisterRequest, {foreignKey: "adminId", onDelete: "SET NULL"})
RegisterRequest.belongsTo(User, {foreignKey: "adminId", as: "Admin"})

//user to user_suspend CASCADE one to many
User.hasMany(UserSuspend, { foreignKey: "userId", onDelete: "CASCADE", as: "UserSuspends" });
UserSuspend.belongsTo(User, { foreignKey: "userId", as: "User"});

//user (admin) to user_suspend SET NULL one to many
User.hasMany(UserSuspend, {foreignKey: "suspendedBy", onDelete: "SET NULL", as: "SuspendedBySuspends"})
UserSuspend.belongsTo(User, {foreignKey: "suspendedBy", as: "SuspendedBy"})

//user (admin) to user_suspend SET NULL one to many
User.hasMany(UserSuspend, {foreignKey: "unsuspendedBy", onDelete: "SET NULL", as: "UnsuspendedBySuspends"})
UserSuspend.belongsTo(User, {foreignKey: "unsuspendedBy", as: "UnsuspendedBy"})

/*
    COMPANY
*/
//company to user_experience SET NULL one to many
Company.hasMany(UserExperience, {
  foreignKey: "companyId",
  onDelete: "SET NULL",
});
UserExperience.belongsTo(Company, { foreignKey: "companyId" });

//company to user_education SET NULL one to many
Company.hasMany(UserEducation, {
  foreignKey: "institutionId",
  onDelete: "SET NULL",
});
UserEducation.belongsTo(Company, { foreignKey: "institutionId" });

//company to jobs CASCADE one to many
Company.hasMany(Job, { foreignKey: "companyId", onDelete: "CASCADE" });
Job.belongsTo(Company, { foreignKey: "companyId" });

/*
    JOB
*/
//job to job_application CASCADE one to many
Job.hasMany(JobApplication, { foreignKey: "jobId", onDelete: "CASCADE" });
JobApplication.belongsTo(Job, { foreignKey: "jobId" });

//job to job_disability CASCADE one to many
Job.hasMany(JobDisability, { foreignKey: "jobId", onDelete: "CASCADE" });
JobDisability.belongsTo(Job, { foreignKey: "jobId" });

//job to job_skill CASCADE one to many
Job.hasMany(JobSkill, { foreignKey: "jobId", onDelete: "CASCADE" });
JobSkill.belongsTo(Job, { foreignKey: "jobId" });


/*
    DISABILITY
*/
//disability to user_disability CASCADE one to many
Disability.hasMany(UserDisability, {
  foreignKey: "disabilityId",
  onDelete: "CASCADE",
});
UserDisability.belongsTo(Disability, { foreignKey: "disabilityId" });

//disability to job_disability CASCADE one to many
Disability.hasMany(JobDisability, {
  foreignKey: "disabilityId",
  onDelete: "CASCADE",
});
JobDisability.belongsTo(Disability, { foreignKey: "disabilityId" });

/*
    SKILL
*/
//skill to user_skill CASCADE one to many
Skill.hasMany(UserSkill, { foreignKey: "skillId", onDelete: "CASCADE" });
UserSkill.belongsTo(Skill, { foreignKey: "skillId" });

//skill to job_skill CASCADE one to many
Skill.hasMany(JobSkill, { foreignKey: "skillId", onDelete: "CASCADE" });
JobSkill.belongsTo(Skill, { foreignKey: "skillId" });

/*
    INDUSTRY
*/
Industry.hasMany(Company, { foreignKey: "industryId", onDelete: "SET NULL" });
Company.belongsTo(Industry, { foreignKey: "industryId" });

module.exports = {
  User,
  UserProfile,
  UserExperience,
  UserDisability,
  UserEducation,
  UserSkill,
  UserSuspend,
  RegisterRequest,
  Company,
  Job,
  JobApplication,
  JobSkill,
  JobDisability,
  Disability,
  Skill,
  Industry,
};