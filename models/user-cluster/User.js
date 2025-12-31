const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const User = sequelize.define(
  "User",
  {
    username: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM("super-admin", "admin", "job-seeker", "company"),
      allowNull: false,
    },
    profilePicture: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    authProvider: {
      type: DataTypes.ENUM("local", "google"),
      defaultValue: "local",
      allowNull: false,
    },
    gaSecret: {
      type: DataTypes.STRING,
      allowNull: true
    },
    refreshToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accountStatus: {
      type: DataTypes.ENUM(
        "pending",
        "requested",
        "rejected",
        "active",
        "suspended",
        "suspended-temp"
      ),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    tableName: "users",
    timestamps: true,
  }
);

module.exports = User;
