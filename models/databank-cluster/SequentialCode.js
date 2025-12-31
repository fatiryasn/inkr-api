const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const SequentialCode = sequelize.define(
  "SequentialCode",
  {
    prefix: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    lastNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    description: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    tableName: "sequential_codes",
    timestamps: true,
  }
);

module.exports = SequentialCode;
