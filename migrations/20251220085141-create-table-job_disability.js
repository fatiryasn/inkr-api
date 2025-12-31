"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("job_disabilities", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      jobId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "jobs",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      disabilityId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "disabilities",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    });

    // ===== INDEXES =====
    await queryInterface.addIndex("job_disabilities", ["jobId"], {
      name: "idx_job_disabilities_job_id",
    });
    await queryInterface.addIndex("job_disabilities", ["disabilityId"], {
      name: "idx_job_disabilities_disability_id",
    });
    await queryInterface.addIndex(
      "job_disabilities",
      ["jobId", "disabilityId"],
      {
        unique: true,
        name: "uniq_job_disability",
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("job_disabilities");
  },
};
