const { DataTypes } = require("sequelize");
const sequelize = require("../../configs/database");

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
      type: DataTypes.STRING,
      allowNull: false,
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING(16),
      allowNull: true,
    },
    bio: {
      type: DataTypes.STRING(500),
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
      type: DataTypes.STRING,
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
    tableName: "user_profiles",
    indexes: [{ fields: ["fullName"] }, { fields: ["country"] }],
  }
);

module.exports = UserProfile;
