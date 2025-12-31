const cron = require("node-cron");
const sequelize = require("../config/database");
const { Job } = require("../models");

cron.schedule("0 */12 * * *", async () => {
  const transaction = await sequelize.transaction();

  try {
    console.log("[CRON] Starting auto-opening of qualified jobs...");

    const today = new Date();
    const todayDateStr = today.toISOString().split("T")[0];

    //find jobs to open
    const jobsToOpen = await Job.findAll({
      where: {
        startDate: {
          [Op.lte]: todayDateStr,
        },
        status: "pending",
        endDate: {
          [Op.gte]: todayDateStr,
        },
      },
      attributes: ["id", "title", "startDate", "endDate", "status"],
      transaction,
    });

    if (jobsToOpen.length === 0) {
      console.log("[CRON] No jobs qualified for auto-opening today.");
      await transaction.commit();
      return;
    }

    //update to open
    const updateResult = await Job.update(
      {
        status: "open",
        updatedAt: today,
      },
      {
        where: {
          id: {
            [Op.in]: jobsToOpen.map((job) => job.id),
          },
          status: "pending",
        },
        transaction,
      }
    );

    await transaction.commit();

    console.log(
      `[CRON] Successfully auto-opened ${updateResult[0]} jobs.`,
      `Jobs opened: ${jobsToOpen
        .map((job) => `#${job.id} (${job.title})`)
        .join(", ")}`
    );
  } catch (err) {
    await transaction.rollback();
    console.error("[CRON] Auto-opening failed:", err.message, err.stack);
  }
});
