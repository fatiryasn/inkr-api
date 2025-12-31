"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("job_applications", {
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

      email: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },

      message: {
        type: Sequelize.STRING(2000),
        allowNull: true,
      },
      portofolioLink: {
        type: Sequelize.STRING(300),
        allowNull: true,
      },
      companyMessage: {
        type: Sequelize.STRING(1000),
        allowNull: true,
      },
      companyExternalLink: {
        type: Sequelize.STRING(300),
        allowNull: true,
      },

      status: {
        type: Sequelize.ENUM(
          "applied",
          "reviewed",
          "accepted",
          "rejected",
          "withdrawn"
        ),
        allowNull: false,
        defaultValue: "applied",
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // ===== INDEXES =====
    await queryInterface.addIndex("job_applications", ["userId"], {
      name: "idx_job_applications_user_id",
    });
    await queryInterface.addIndex("job_applications", ["jobId"], {
      name: "idx_job_applications_job_id",
    });
    await queryInterface.addIndex("job_applications", ["status"], {
      name: "idx_job_applications_status",
    });
    await queryInterface.addIndex("job_applications", ["jobId", "userId"], {
      unique: true,
      name: "uniq_job_applications",
    });
    await queryInterface.addIndex("job_applications", ["createdAt"], {
      name: "idx_job_applications_created_at",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("job_applications");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_job_applications_status";'
    );
  },
};
