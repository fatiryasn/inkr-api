const { DataTypes } = require("sequelize");
const sequelize = require("../../configs/database");

const Industry = sequelize.define(
  "Industry",
  {
    name: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    tableName: "industries",
    indexes: [{ fields: ["name"] }],
  }
);

module.exports = Industry;
