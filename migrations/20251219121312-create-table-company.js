"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("companies", {
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
      companyName: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      companyDescription: {
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
      establishedYear: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      industryId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "industries",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      websiteLink: {
        type: Sequelize.STRING(300),
        allowNull: true,
      },
    });

    // ===== INDEXES =====
    await queryInterface.addIndex("companies", ["userId"], {
      unique: true,
      name: "uniq_companies_user_id",
    });

    await queryInterface.addIndex("companies", ["companyName"], {
      name: "idx_companies_name",
    });

    await queryInterface.addIndex("companies", ["industryId"], {
      name: "idx_companies_industry_id",
    });

    await queryInterface.addIndex("companies", ["country"], {
      name: "idx_companies_country",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("companies");
  },
};
