const { DataTypes } = require("sequelize");
const sequelize = require("../../configs/database");

const UserDisability = sequelize.define(
  "UserDisability",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    disabilityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "disabilities",
        key: "id",
      },
    },
    disabilityName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        "sensory",
        "intellectual",
        "mental",
        "physical",
        "multiple",
        "other"
      ),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(300),
      allowNull: true
    },
  },
  {
    tableName: "user_disabilities",
  }
);

module.exports = UserDisability;
