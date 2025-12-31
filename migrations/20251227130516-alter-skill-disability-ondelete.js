"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      "user_disabilities",
      "user_disabilities_ibfk_2"
    );
    await queryInterface.removeConstraint("user_skills", "user_skills_ibfk_2");

    await queryInterface.addConstraint("user_disabilities", {
      fields: ["disabilityId"],
      type: "foreign key",
      name: "user_disabilities_disabilityId_fkey",
      references: {
        table: "disabilities",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    await queryInterface.addConstraint("user_skills", {
      fields: ["skillId"],
      type: "foreign key",
      name: "user_skills_skillId_fkey",
      references: {
        table: "skills",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      "user_disabilities",
      "user_disabilities_disabilityId_fkey"
    );
    await queryInterface.removeConstraint(
      "user_skills",
      "user_skills_skillId_fkey"
    );

    await queryInterface.addConstraint("user_disabilities", {
      fields: ["disabilityId"],
      type: "foreign key",
      name: "user_disabilities_disabilityId_fkey",
      references: {
        table: "disabilities",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addConstraint("user_skills", {
      fields: ["skillId"],
      type: "foreign key",
      name: "user_skills_skillId_fkey",
      references: {
        table: "skills",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },
};
