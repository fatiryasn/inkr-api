const cron = require("node-cron");
const { User, UserSuspend } = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database")

cron.schedule("0 */12 * * *", async () => {
  let transaction;

  try {
    console.log("[CRON] Starting auto-activation of suspended users...");

    const now = new Date();

    //find expired temporary suspensions
    const expiredSuspensions = await UserSuspend.findAll({
      where: {
        type: "temporary",
        suspendUntil: {
          [Op.lte]: now,
          [Op.not]: null,
        },
        unsuspendedAt: null,
      },
      attributes: ["id", "userId", "suspendCode", "suspendUntil"],
    });

    if (expiredSuspensions.length === 0) {
      console.log("[CRON] No expired suspensions found.");
      return;
    }

    transaction = await sequelize.transaction();

    const userIds = [...new Set(expiredSuspensions.map((s) => s.userId))];

    //update account status
    const [userUpdateCount] = await User.update(
      {
        accountStatus: "active",
        updatedAt: now,
      },
      {
        where: {
          id: { [Op.in]: userIds },
          accountStatus: "suspended-temp",
        },
        transaction,
      }
    );

    //mark UserSuspend as auto-unsuspended
    const [suspendUpdateCount] = await UserSuspend.update(
      {
        unsuspendedAt: now,
        unsuspendReason:
          "Auto-unsuspended by system (temporary suspension expired)",
        updatedAt: now,
      },
      {
        where: {
          id: { [Op.in]: expiredSuspensions.map((s) => s.id) },
        },
        transaction,
      }
    );

    //commit
    await transaction.commit();

    console.log(
      `[CRON] Successfully auto-activated ${userUpdateCount} users and updated ${suspendUpdateCount} suspensions.`
    );
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("[CRON] Auto-activation failed:", err.message);
  }
});
