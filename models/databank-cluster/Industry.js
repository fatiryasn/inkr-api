const { DataTypes } = require("sequelize");
const sequelize = require("../../configs/database");

const Industry = sequelize.define(
  "Industry",
  {
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "industries",
    indexes: [{ fields: ["name"] }],
  }
);

module.exports = Industry;
