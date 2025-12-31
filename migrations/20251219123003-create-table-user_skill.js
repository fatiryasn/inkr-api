"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_skills", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      skillId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "skills",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      description: {
        type: Sequelize.STRING(300),
        allowNull: true,
      },
    });

    await queryInterface.addIndex("user_skills", ["userId"], {
      name: "idx_user_skills_user_id",
    });
    await queryInterface.addIndex("user_skills", ["skillId"], {
      name: "idx_user_skills_skill_id",
    });
    await queryInterface.addIndex("user_skills", ["userId", "skillId"], {
      unique: true,
      name: "uniq_user_skill",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("user_skills");
  },
};
