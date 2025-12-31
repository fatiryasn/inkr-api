"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_educations", {
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
      institutionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "companies",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      institutionName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      fieldOfStudy: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      degree: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      description: {
        type: Sequelize.STRING(300),
        allowNull: true,
      },
    });

    // ===== INDEXES =====
    await queryInterface.addIndex("user_educations", ["userId"], {
      name: "idx_user_educations_user_id",
    });
    await queryInterface.addIndex("user_educations", ["institutionId"], {
      name: "idx_user_educations_institution_id",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("user_educations");
  },
};
