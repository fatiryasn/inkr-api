const { DataTypes } = require("sequelize");
const sequelize = require("../../configs/database");

const Disability = sequelize.define(
  "Disability",
  {
    name: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM(
        "visual",
        "hearing",
        "intellectual",
        "mental",
        "physical"
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
