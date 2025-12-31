"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_disabilities", {
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
      disabilityId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "disabilities",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      description: {
        type: Sequelize.STRING(300),
        allowNull: true,
      },
    });

    await queryInterface.addIndex("user_disabilities", ["userId"], {
      name: "idx_user_disabilities_user_id",
    });
    await queryInterface.addIndex("user_disabilities", ["disabilityId"], {
      name: "idx_user_disabilities_disability_id",
    });
    await queryInterface.addIndex(
      "user_disabilities",
      ["userId", "disabilityId"],
      {
        unique: true,
        name: "uniq_user_disability",
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("user_disabilities");
  },
};
