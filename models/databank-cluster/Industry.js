const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Industry = sequelize.define(
  "Industry",
  {
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    tableName: "industries",
    timestamps: false
  }
);

module.exports = Industry;