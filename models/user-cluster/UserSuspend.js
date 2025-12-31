// models/usersuspend.js
const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const UserSuspend = sequelize.define(
  "UserSuspend",
  {
    suspendCode: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^SPD\d+$/,
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("temporary", "permanent"),
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    suspendedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    suspendedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    suspendUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    unsuspendedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    unsuspendedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    unsuspendReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "user_suspends",
    timestamps: true,
  }
);

module.exports = UserSuspend;
