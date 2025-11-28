const { Job, Company } = require("../models");

const checkJobOwner = async (req, res, next) => {
  try {
    const jobId = req.params.jobId;

    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const company = await Company.findOne({ where: { id: job.companyId } });
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    const userId = req.user.id
    if (!userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (Number(company.userId) !== Number(userId)) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied: not job owner" });
    }

    req.job = job;
    req.company = company;

    next();
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

module.exports = checkJobOwner;
