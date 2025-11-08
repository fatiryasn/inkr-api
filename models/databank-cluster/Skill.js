const { DataTypes } = require("sequelize");
const sequelize = require("../../configs/database");

const Skill = sequelize.define(
  "Skill",
  {
    name: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    tableName: "skills",
    indexes: [{ fields: ["name"] }],
  }
);

module.exports = Skill;
