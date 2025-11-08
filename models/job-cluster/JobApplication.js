const { DataTypes } = require("sequelize");
const sequelize = require("../../configs/database");

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
    status: {
      type: DataTypes.ENUM(
        "applied",
        "reviewed",
        "accepted",
        "rejected",
        "withdrawn"
      ),
      allowNull: false,
    },
    appliedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "job_applications",
    indexes: [
      { fields: ["jobId"] },
      { fields: ["userId"] },
      { fields: ["status"] },
    ],
    uniqueKeys: {
      unique_user_job: {
        fields: ["jobId", "userId"],
      },
    },
  }
);

module.exports = JobApplication;
