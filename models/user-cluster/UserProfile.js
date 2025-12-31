const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const UserProfile = sequelize.define(
  "UserProfile",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    fullName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING(16),
      allowNull: true,
    },
    bio: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM("male", "female", "blank"),
      defaultValue: "blank",
      allowNull: false,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    timestamps: false,
    tableName: "user_profiles",
    timestamps: false,
  }
);

module.exports = UserProfile;