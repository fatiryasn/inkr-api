const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const UserExperience = sequelize.define(
  "UserExperience",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "companies",
        key: "id",
      },
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    experienceType: {
      type: DataTypes.ENUM(
        "internship",
        "full-time",
        "part-time",
        "contract",
        "freelance"
      ),
      allowNull: false,
      defaultValue: "full-time",
    },

    position: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
  },
  {
    timestamps: false,
    tableName: "user_experiences",
  }
);

module.exports = UserExperience;
