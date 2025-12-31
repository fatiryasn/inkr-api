"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sequential_codes", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      prefix: {
        type: Sequelize.STRING(10),
        allowNull: false,
        unique: true,
      },
      lastNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      description: {
        type: Sequelize.STRING(100),
        allowNull: true,
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

    await queryInterface.bulkInsert("sequential_codes", [
      {
        prefix: "RQS",
        lastNumber: 0,
        description: "Register Request Codes",
      },
      {
        prefix: "SPD",
        lastNumber: 0,
        description: "User Suspend Codes",
      },
    ]);

    // INDEXES
    await queryInterface.addIndex("sequential_codes", ["prefix"], {
      unique: true,
      name: "idx_sequential_codes_prefix",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("sequential_codes");
  },
};
