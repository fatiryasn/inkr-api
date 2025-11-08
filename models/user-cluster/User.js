const { DataTypes } = require("sequelize");
const sequelize = require("../../configs/database");

const User = sequelize.define(
  "User",
  {
    username: {
      type: DataTypes.STRING(16),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(16),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM("admin", "job-seeker", "company"),
      allowNull: false,
    },
    authProvider: {
      type: DataTypes.ENUM("local", "google"),
      defaultValue: "local",
      allowNull: false,
    },
    refreshToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    isComplete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    indexes: [
      { fields: ["createdAt"] },
      { fields: ["role"] },
      { fields: ["refreshToken"] },
    ],
  }
);

module.exports = User;
