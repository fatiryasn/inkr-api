"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_profiles", {
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
      fullName: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      phoneNumber: {
        type: Sequelize.STRING(16),
        allowNull: true,
      },
      bio: {
        type: Sequelize.STRING(2000),
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      gender: {
        type: Sequelize.ENUM("male", "female", "blank"),
        allowNull: false,
        defaultValue: "blank",
      },
      dateOfBirth: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
    });

    // ===== INDEXES =====
    await queryInterface.addIndex("user_profiles", ["userId"], {
      unique: true,
      name: "uniq_user_profiles_user_id",
    });
    await queryInterface.addIndex("user_profiles", ["fullName"], {
      name: "idx_user_profiles_fullName",
    });
    await queryInterface.addIndex("user_profiles", ["country"], {
      name: "idx_user_profiles_country",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("user_profiles");

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_user_profiles_gender";'
    );
  },
};
