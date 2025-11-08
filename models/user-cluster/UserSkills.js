const { DataTypes } = require("sequelize");
const sequelize = require("../../configs/database");

const UserSkill = sequelize.define(
  "UserSkill",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    skillId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "skills",
        key: "id",
      },
    },
    skillName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "user_skills",
  }
);

module.exports = UserSkill;
