const { DataTypes } = require("sequelize");
const sequelize = require("../../configs/database");

const Disability = sequelize.define(
  "Disability",
  {
    name: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(100),
      allowNull: true,
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
    tableName: "disabilities",
    indexes: [{ fields: ["name"] }, { fields: ["type"] }],
  }
);

module.exports = Disability;
