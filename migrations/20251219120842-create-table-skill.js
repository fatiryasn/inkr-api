"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("skills", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
    });

    // ===== INDEX =====
    await queryInterface.addIndex("skills", ["name"], {
      unique: true,
      name: "uniq_skills_name",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("skills");
  },
};
