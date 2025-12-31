"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("job_skills", {
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
      skillId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "skills",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    });

    // ===== INDEXES =====
    await queryInterface.addIndex("job_skills", ["jobId"], {
      name: "idx_job_skills_job_id",
    });
    await queryInterface.addIndex("job_skills", ["skillId"], {
      name: "idx_job_skills_skill_id",
    });
    await queryInterface.addIndex("job_skills", ["jobId", "skillId"], {
      unique: true,
      name: "uniq_job_skill",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("job_skills");
  },
};
