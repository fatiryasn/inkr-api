const sequelize = require("../configs/database");

const Disability = require("./databank-cluster/Disability");
const Industry = require("./databank-cluster/Industry");
const Skill = require("./databank-cluster/Skill");

const Job = require("./job-cluster/Job");
const JobApplication = require("./job-cluster/JobApplication");
const JobDisability = require("./job-cluster/JobDisability");
const JobSkill = require("./job-cluster/JobSkill");

const Comment = require("./post-cluster/Comment");
const Post = require("./post-cluster/Post");
const Upvote = require("./post-cluster/Upvote");

const Company = require("./user-cluster/Company");
const User = require("./user-cluster/User");
const UserDisability = require("./user-cluster/UserDisability");
const UserEducation = require("./user-cluster/UserEducation");
const UserExperience = require("./user-cluster/UserExperience");
const UserProfile = require("./user-cluster/UserProfile");
const UserSkill = require("./user-cluster/UserSkills");


/*
    USER
 */
//user to user_profile CASCADE one to one
User.hasOne(UserProfile, {foreignKey: "userId", onDelete: "CASCADE"})
UserProfile.belongsTo(User, {foreignKey: "userId"})

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

//user to post CASCADE one to many
User.hasMany(Post, { foreignKey: "userId", onDelete: "CASCADE" });
Post.belongsTo(User, { foreignKey: "userId" });

//user to comment CASCADE one to many
User.hasMany(Comment, { foreignKey: "userId", onDelete: "CASCADE" });
Comment.belongsTo(User, { foreignKey: "userId" });

//user to upvote CASCADE one to many
User.hasMany(Upvote, { foreignKey: "userId", onDelete: "CASCADE" });
Upvote.belongsTo(User, { foreignKey: "userId" });

/*
    COMPANY
*/
//company to user_experience SET NULL one to many
Company.hasMany(UserExperience, {foreignKey: "companyId", onDelete: "SET NULL"})
UserExperience.belongsTo(Company, {foreignKey: "companyId"})

//company to user_education SET NULL one to many
Company.hasMany(UserEducation, {foreignKey: "institutionId", onDelete: "SET NULL"})
UserEducation.belongsTo(Company, {foreignKey: "institutionId"})

//company to jobs CASCADE one to many
Company.hasMany(Job, {foreignKey: "companyId", onDelete: "CASCADE"})
Job.belongsTo(Company, {foreignKey: "companyId"})

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
    POST
*/
//post to comment CASCADE one to many
Post.hasMany(Comment, { foreignKey: "postId", onDelete: "CASCADE" });
Comment.belongsTo(Post, { foreignKey: "postId" });

//post to upvote CASCADE one to many
Post.hasMany(Upvote, { foreignKey: "postId", onDelete: "CASCADE" });
Upvote.belongsTo(Post, { foreignKey: "postId" });

/*
    DISABILITY
*/
//disability to user_disability SET NULL one to many
Disability.hasMany(UserDisability, { foreignKey: "disabilityId", onDelete: "SET NULL" });
UserDisability.belongsTo(Disability, { foreignKey: "disabilityId" });

//disability to job_disability SET NULL one to many
Disability.hasMany(JobDisability, { foreignKey: "disabilityId", onDelete: "SET NULL" });
JobDisability.belongsTo(Disability, { foreignKey: "disabilityId" });

/*
    SKILL
*/
//skill to user_skill SET NULL one to many
Skill.hasMany(UserSkill, { foreignKey: "skillId", onDelete: "SET NULL" });
UserSkill.belongsTo(Skill, { foreignKey: "skillId" });

//skill to job_skill SET NULL one to many
Skill.hasMany(JobSkill, { foreignKey: "skillId", onDelete: "SET NULL" });
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
    Company,
    Job,
    JobApplication,
    JobSkill,
    JobDisability,
    Post,
    Comment,
    Upvote,
    Disability,
    Skill,
    Industry
}