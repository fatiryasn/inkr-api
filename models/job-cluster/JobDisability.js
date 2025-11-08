const { DataTypes } = require("sequelize");
const sequelize = require("../../configs/database");

const JobDisability = sequelize.define(
  "JobDisability",
  {
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "jobs",
        key: "id",
      },
    },
    disabilityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "disabilities",
        key: "id",
      },
    },
    disabilityName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "job_disabilities",
  }
);

module.exports = JobDisability;
