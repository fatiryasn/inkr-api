"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("jobs", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      companyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "companies",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      title: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(2000),
        allowNull: false,
      },

      employmentType: {
        type: Sequelize.ENUM("full-time", "part-time", "internship", "blank"),
        allowNull: false,
      },
      locationType: {
        type: Sequelize.ENUM("on-site", "remote", "hybrid", "blank"),
        allowNull: false,
      },

      country: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      address: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      minSalary: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      maxSalary: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },

      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM("pending", "open", "closed", "cancelled"),
        allowNull: false,
        defaultValue: "pending",
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
    await queryInterface.addIndex("jobs", ["title"], {
      name: "idx_jobs_title",
    });

    await queryInterface.addIndex("jobs", ["status"], {
      name: "idx_jobs_status",
    });

    await queryInterface.addIndex("jobs", ["companyId"], {
      name: "idx_jobs_company_id",
    });

    await queryInterface.addIndex("jobs", ["country"], {
      name: "idx_jobs_country",
    });

    await queryInterface.addIndex(
      "jobs",
      ["employmentType", "locationType"],
      {
        name: "idx_jobs_type_location",
      }
    );

    await queryInterface.addIndex("jobs", ["createdAt"], {
      name: "idx_jobs_created_at",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("jobs");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_jobs_employmentType";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_jobs_locationType";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_jobs_status";'
    );
  },
};
