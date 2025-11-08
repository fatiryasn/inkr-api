const { DataTypes } = require("sequelize");
const sequelize = require("../../configs/database");

const Post = sequelize.define(
  "Post",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    postPicture: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    caption: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
  },
  {
    tableName: "posts",
  }
);

module.exports = Post;
