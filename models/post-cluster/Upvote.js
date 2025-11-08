const { DataTypes } = require("sequelize");
const sequelize = require("../../configs/database");

const Upvote = sequelize.define(
  "Upvote",
  {
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "posts",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    upvotedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "upvotes",
  }
);

module.exports = Upvote;
