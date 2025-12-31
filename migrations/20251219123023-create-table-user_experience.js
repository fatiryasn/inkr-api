"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_experiences", {
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
      companyId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "companies",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      companyName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      experienceType: {
        type: Sequelize.ENUM(
          "internship",
          "full-time",
          "part-time",
          "contract",
          "freelance"
        ),
        allowNull: false,
        defaultValue: "full-time",
      },
      position: {
        type: Sequelize.STRING,
        allowNull: false,
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
    await queryInterface.addIndex("user_experiences", ["userId"], {
      name: "idx_user_experiences_user_id",
    });
    await queryInterface.addIndex("user_experiences", ["companyId"], {
      name: "idx_user_experiences_company_id",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("user_experiences");

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_user_experiences_experienceType";'
    );
  },
};
