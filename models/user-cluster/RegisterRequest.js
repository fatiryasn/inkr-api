const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const RegisterRequest = sequelize.define(
  "RegisterRequest",
  {
    registerCode: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^RQS\d+$/,
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    adminId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    reason: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
  },
  {
    tableName: "register_requests",
    timestamps: true,
  }
);

module.exports = RegisterRequest;
