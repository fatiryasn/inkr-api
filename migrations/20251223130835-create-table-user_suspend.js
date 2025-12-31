"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_suspends", {
      id: {
        type: Sequelize.INTEGER,
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
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      suspendCode: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      type: {
        type: Sequelize.ENUM("temporary", "permanent"),
        allowNull: false,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      suspendedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      suspendedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      suspendUntil: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      unsuspendedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      unsuspendedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      unsuspendReason: {
        type: Sequelize.TEXT,
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
      CREATE TRIGGER before_user_suspends_insert
      BEFORE INSERT ON user_suspends
      FOR EACH ROW
      BEGIN
        DECLARE next_seq INT;
        
        SELECT lastNumber + 1 INTO next_seq
        FROM sequential_codes 
        WHERE prefix = 'SPD'
        FOR UPDATE;
        
        UPDATE sequential_codes 
        SET lastNumber = next_seq 
        WHERE prefix = 'SPD';
        
        SET NEW.suspendCode = CONCAT('SPD', next_seq);
      END
    `);

    // INDEXES
    await queryInterface.addIndex("user_suspends", ["suspendCode"], {
      unique: true,
      name: "uniq_user_suspends_suspend_code",
    });
    await queryInterface.addIndex("user_suspends", ["userId"], {
      name: "idx_user_suspends_user_id",
    });
    await queryInterface.addIndex("user_suspends", ["type"], {
      name: "idx_user_suspends_type",
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "DROP TRIGGER IF EXISTS before_user_suspends_insert"
    );

    await queryInterface.dropTable("user_suspends");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_user_suspends_type";'
    );
  },
};
