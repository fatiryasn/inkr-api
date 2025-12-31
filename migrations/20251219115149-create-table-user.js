"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      username: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      role: {
        type: Sequelize.ENUM("admin", "job-seeker", "company"),
        allowNull: false,
      },
      profilePicture: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      authProvider: {
        type: Sequelize.ENUM("local", "google"),
        allowNull: false,
        defaultValue: "local",
      },
      refreshToken: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      accountStatus: {
        type: Sequelize.ENUM(
          "pending",
          "requested",
          "rejected",
          "active",
          "suspended",
          "suspended-temp"
        ),
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
    await queryInterface.addIndex("users", ["username"], {
      unique: true,
      name: "uniq_users_username",
    });

    await queryInterface.addIndex("users", ["email"], {
      unique: true,
      name: "uniq_users_email",
    });

    await queryInterface.addIndex("users", ["role"], {
      name: "idx_users_role",
    });

    await queryInterface.addIndex("users", ["accountStatus"], {
      name: "idx_users_account_status",
    });

    await queryInterface.addIndex("users", ["refreshToken"], {
      name: "idx_users_refresh_token",
    });

    await queryInterface.addIndex("users", ["createdAt"], {
      name: "idx_users_created_at",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("users");

    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS enum_users_role;"
    );
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS enum_users_authProvider;"
    );
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS enum_users_accountStatus;"
    );
  },
};
