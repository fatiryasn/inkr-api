const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

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
    description: {
      type: DataTypes.STRING(300),
      allowNull: true
    },
  },
  {
    timestamps: false,
    tableName: "user_disabilities",
  }
);

module.exports = UserDisability;
