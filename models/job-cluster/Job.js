const { DataTypes } = require("sequelize");
const sequelize = require("../../configs/database");

const Job = sequelize.define(
  "Job",
  {
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "companies",
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(2000),
      allowNull: false,
    },
    employmentType: {
      type: DataTypes.ENUM("full-time", "part-time", "internship", "blank"),
      allowNull: false,
    },
    locationType: {
      type: DataTypes.ENUM("on-site", "remote", "hybrid", "blank"),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    minSalary: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    maxSalary: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "open", "closed", "cancelled"),
      defaultValue: "pending",
      allowNull: false,
    },
  },
  {
    tableName: "jobs",
    timestamps: true,
    indexes: [
      { fields: ["title"] },
      { fields: ["status"] },
      { fields: ["companyId"] },
      { fields: ["employmentType", "locationType", "status"] },
    ],
  }
);

module.exports = Job;
