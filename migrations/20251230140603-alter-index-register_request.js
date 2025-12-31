"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.removeIndex(
      "register_requests",
      "idx_register_requests_status"
    );

    // Add the optimized composite indexes
    await queryInterface.addIndex(
      "register_requests",
      ["status", "createdAt"],
      {
        name: "idx_register_requests_status_created_at",
      }
    );
  },

  async down(queryInterface) {
    // Remove the composite indexes
    await queryInterface.removeIndex(
      "register_requests",
      "idx_register_requests_status_created_at"
    );
  },
};
