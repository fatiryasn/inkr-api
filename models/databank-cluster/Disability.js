const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Disability = sequelize.define(
  "Disability",
  {
    name: {
      type: DataTypes.STRING(50),
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
  },
  {
    timestamps: false,
    tableName: "disabilities",
  }
);

module.exports = Disability;
