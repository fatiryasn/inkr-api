"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("register_requests", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      registerCode: {
        type: Sequelize.STRING,
        allowNull: false,
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
      adminId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      status: {
        type: Sequelize.ENUM("pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },
      reason: {
        type: Sequelize.STRING(300),
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

    await queryInterface.sequelize.query(`
      CREATE TRIGGER before_register_request_insert
      BEFORE INSERT ON register_requests
      FOR EACH ROW
      BEGIN
        DECLARE next_seq INT;
        
        SELECT lastNumber + 1 INTO next_seq
        FROM sequential_codes 
        WHERE prefix = 'RQS'
        FOR UPDATE;
        
        UPDATE sequential_codes 
        SET lastNumber = next_seq 
        WHERE prefix = 'RQS';
        
        SET NEW.registerCode = CONCAT('RQS', next_seq);
      END
    `);

    // ===== INDEXES =====
    await queryInterface.addIndex("register_requests", ["registerCode"], {
      unique: true,
      name: "uniq_register_requests_register_code",
    });

    await queryInterface.addIndex("register_requests", ["userId"], {
      name: "idx_register_requests_user_id",
    });

    await queryInterface.addIndex("register_requests", ["adminId"], {
      name: "idx_register_requests_admin_id",
    });

    await queryInterface.addIndex("register_requests", ["status"], {
      name: "idx_register_requests_status",
    });

    await queryInterface.addIndex("register_requests", ["createdAt"], {
      name: "idx_register_requests_created_at",
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "DROP TRIGGER IF EXISTS before_register_request_insert"
    );

    await queryInterface.dropTable("register_requests");

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_register_requests_status";'
    );
  },
};
