const { DataTypes } = require("sequelize");
const sequelize = require("../../configs/database");

const Company = sequelize.define(
  "Company",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    companyName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    companyDescription: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    establishedYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    industryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "industries",
        key: "id",
      },
    },
    industryName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    websiteLink: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
  },
  {
    tableName: "companies",
    indexes: [
      { fields: ["companyName"] },
      { fields: ["industryId"] },
      { fields: ["country"] },
      { fields: ["city"] },
    ],
  }
);

module.exports = Company;
