const { DataTypes } = require("sequelize");
const sequelize = require("../../configs/database");

const Comment = sequelize.define(
  "Comment",
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
    comment: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    commentedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "comments",
  }
);

module.exports = Comment;
