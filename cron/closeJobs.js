const cron = require("node-cron");
const { Job } = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

cron.schedule("0 */12 * * *", async () => {
  const transaction = await sequelize.transaction();

  try {
    console.log("[CRON] Starting auto-closing of expired jobs...");

    const today = new Date();
    const todayDateStr = today.toISOString().split("T")[0];

    //find qualified jobs
    const jobsToClose = await Job.findAll({
      where: {
        endDate: {
          [Op.lt]: todayDateStr,
        },
        status: "open",
      },
      attributes: ["id", "title", "startDate", "endDate", "status"],
      transaction,
    });

    if (jobsToClose.length === 0) {
      console.log("[CRON] No expired jobs to close today.");
      await transaction.commit();
      return;
    }

    //update job
    const updateResult = await Job.update(
      {
        status: "closed",
        updatedAt: today,
      },
      {
        where: {
          id: {
            [Op.in]: jobsToClose.map((job) => job.id),
          },
          status: "open",
        },
        transaction,
      }
    );

    await transaction.commit();

     console.log(
       `[CRON] Successfully auto-closed ${updateResult[0]} jobs.`,
       `Jobs closed: ${jobsToClose
         .map((job) => `#${job.id} (${job.title})`)
         .join(", ")}`
     );
  } catch (err) {
    await transaction.rollback();
    console.error("[CRON] Auto-closing failed:", err.message, err.stack);
  }
});
