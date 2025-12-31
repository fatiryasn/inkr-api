"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("industries", {
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
    await queryInterface.addIndex("industries", ["name"], {
      unique: true,
      name: "uniq_industries_name",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("industries");
  },
};
