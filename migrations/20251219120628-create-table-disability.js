"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("disabilities", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM(
          "sensory",
          "intellectual",
          "mental",
          "physical",
          "multiple",
          "other"
        ),
        allowNull: false,
      },
    });

    // ===== INDEXES =====
    await queryInterface.addIndex("disabilities", ["name"], {
      unique: true,
      name: "uniq_disabilities_name",
    });

    await queryInterface.addIndex("disabilities", ["type"], {
      name: "idx_disabilities_type"
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable("disabilities");

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_disabilities_type";'
    );
  },
};
