const { DataTypes } = require("sequelize");
const sequelize = require("../../configs/database");

const Skill = sequelize.define(
  "Skill",
  {
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "skills",
    indexes: [{ fields: ["name"] }],
  }
);

module.exports = Skill;
