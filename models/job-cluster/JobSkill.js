const { DataTypes } = require("sequelize");
const sequelize = require("../../configs/database");

const JobSkill = sequelize.define(
  "JobSkill",
  {
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "jobs",
        key: "id",
      },
    },
    skillId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "skills",
        key: "id",
      },
    },
    skillName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "job_skills",
  }
);

module.exports = JobSkill;
