"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // ===== DROP OLD INDEXES =====
    await queryInterface.removeIndex("users", "idx_users_role").catch(() => {});
    await queryInterface
      .removeIndex("users", "idx_users_account_status")
      .catch(() => {});
    await queryInterface
      .removeIndex("users", "idx_users_refresh_token")
      .catch(() => {});
    await queryInterface
      .removeIndex("users", "idx_users_created_at")
      .catch(() => {});

    // ===== CREATE NEW INDEXES =====
     await queryInterface.addIndex("users", ["updatedAt"], {
       name: "idx_users_updated_at",
     });

    await queryInterface.addIndex(
      "users",
      ["accountStatus", "role", "updatedAt"],
      {
        name: "idx_users_status_role_updated",
      }
    );

    await queryInterface.addIndex("users", ["refreshToken"], {
      name: "idx_users_refresh_token",
    });
  },

  async down(queryInterface, Sequelize) {
    // remove all new indexes
    await queryInterface
      .removeIndex("users", "idx_users_updated_at")
      .catch(() => {});
    await queryInterface
      .removeIndex("users", "idx_users_status_role_updated")
      .catch(() => {});
    await queryInterface
      .removeIndex("users", "idx_users_refresh_token")
      .catch(() => {});
  },
};
