const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Skill = sequelize.define(
  "Skill",
  {
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    timestamps: false,
    tableName: "skills",
  }
);

module.exports = Skill;
