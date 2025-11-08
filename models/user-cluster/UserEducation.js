const { DataTypes } = require("sequelize");
const sequelize = require("../../configs/database");

const UserEducation = sequelize.define(
  "UserEducation",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    institutionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "companies",
        key: "id",
      },
    },
    institutionName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fieldOfStudy: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    degree: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
  },
  {
    tableName: "user_educations",
    indexes: [{ fields: ["institutionName"] }],
  }
);

module.exports = UserEducation;
