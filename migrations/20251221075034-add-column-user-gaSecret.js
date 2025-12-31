"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "gaSecret", {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'authProvider'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "gaSecret");
  },
};