const cron = require("node-cron");
const { User } = require("../models");
const { Op } = require("sequelize");

cron.schedule("0 */12 * * *", async () => {
  try {
    const expiredTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const deleted = await User.destroy({
      where: {
        accountStatus: "pending",
        createdAt: {
          [Op.lt]: expiredTime,
        },
      },
    });

    if (deleted > 0) {
      console.log(`[CRON] Deleted ${deleted} expired pending accounts`);
    } else {
      console.log(`[CRON] Deleted no expired pending accounts`);
    }
  } catch (err) {
    console.error("[CRON] Cleanup failed:", err);
  }
});
