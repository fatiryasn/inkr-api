"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("users", "role", {
      type: Sequelize.ENUM("admin", "super-admin", "job-seeker", "company"),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("users", "role", {
      type: Sequelize.ENUM("admin", "job-seeker", "company"),
      allowNull: false,
    });
  },
};
