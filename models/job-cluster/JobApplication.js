const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const JobApplication = sequelize.define(
  "JobApplication",
  {
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "jobs",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    status: {
      type: DataTypes.ENUM(
        "applied",
        "reviewed",
        "accepted",
        "rejected",
        "withdrawn"
      ),
      allowNull: false,
      defaultValue: "applied"
    },
    message: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    portofolioLink: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    companyMessage: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    companyExternalLink: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
  },
  {
    tableName: "job_applications",
    timestamps: true
  }
);

module.exports = JobApplication;
