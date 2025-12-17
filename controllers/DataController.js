const { Op, fn, col, literal } = require("sequelize");
const {
  Industry,
  Disability,
  Skill,
  User,
  UserProfile,
  Company,
  Job,
  JobApplication,
} = require("../models");
const sequelize = require("../configs/database");

//industries search-based
exports.getIndustries = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || search.trim() === "") {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const industries = await Industry.findAll({
      where: {
        name: { [Op.like]: `%${search}%` },
      },
      order: [["name", "ASC"]],
      limit: 30,
    });

    return res.status(200).json({
      success: true,
      data: industries,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//disabilities search-based
exports.getDisabilities = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || search.trim() === "") {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const disabilities = await Disability.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { type: { [Op.like]: `%${search}%` } },
        ],
      },
      order: [["name", "ASC"]],
      limit: 30,
    });

    return res.status(200).json({
      success: true,
      data: disabilities,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//skills search-based
exports.getSkills = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || search.trim() === "") {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const skills = await Skill.findAll({
      where: {
        name: { [Op.like]: `%${search}%` },
      },
      order: [["name", "ASC"]],
      limit: 30,
    });

    return res.status(200).json({
      success: true,
      data: skills,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//user preview on profile page
exports.getOtherUserPreviews = async (req, res) => {
  try {
    const chosenRole = req.query.role;
    const excludeIds = [];

    if (req.user?.id) {
      excludeIds.push(Number(req.user.id));
    }
    if (req.query.excludeCurrentUserId) {
      excludeIds.push(Number(req.query.excludeCurrentUserId));
    }

    // where clause user
    const where = {
      role: chosenRole,
      isActive: true,
      isComplete: true,
      isVerified: true,
    };

    if (excludeIds.length > 0) {
      where.id = { [Op.notIn]: excludeIds };
    }

    //include
    let include = [];
    if (chosenRole === "job-seeker") {
      include = [
        {
          model: UserProfile,
          attributes: ["fullName"],
        },
      ];
    } else if (chosenRole === "company") {
      include = [
        {
          model: Company,
          attributes: ["companyName", "industryName", "industryId"],
          include: [
            {
              model: Industry,
              attributes: ["name"],
            },
          ],
        },
      ];
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    // random function sesuai DB
    const dialect = sequelize.getDialect();
    const randomFn =
      dialect === "mysql" || dialect === "mariadb" ? "RAND()" : "RANDOM()";

    const users = await User.findAll({
      where,
      attributes: ["id", "username", "profilePicture"],
      include,
      order: [literal(randomFn)],
      limit: 4,
    });

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//job preview on job detail page
exports.getOtherJobPreviews = async (req, res) => {
  try {
    const excludeIds = [];

    if (req.query.excludeCurrentJobId) {
      excludeIds.push(Number(req.query.excludeCurrentJobId));
    }

    // where clause job
    const where = {
      status: "open",
    };

    if (excludeIds.length > 0) {
      where.id = {
        [Op.notIn]: excludeIds,
      };
    }

    // random function sesuai DB
    const dialect = sequelize.getDialect();
    const randomFn =
      dialect === "mysql" || dialect === "mariadb" ? "RAND()" : "RANDOM()";

    const jobs = await Job.findAll({
      where,
      attributes: [
        "id",
        "title",
        "employmentType",
        "locationType",
        "createdAt",
      ],
      include: [
        {
          model: Company,
          attributes: ["id", "companyName"],
          include: [
            {
              model: User,
              attributes: ["profilePicture", "username"],
            },
          ],
        },
      ],
      order: [literal(randomFn)],
      limit: 4,
    });

    return res.status(200).json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//overview statistics
exports.getCompanyOverviewStats = async (req, res) => {
  try {
    const authUserId = req.user && req.user.id;
    if (!authUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const company = await Company.findOne({ where: { userId: authUserId } });
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company tidak ditemukan" });
    }

    // ambil semua job milik company
    const companyJobs = await Job.findAll({
      where: { companyId: company.id },
      attributes: [
        "id",
        "title",
        "startDate",
        "endDate",
        "status",
        "createdAt",
      ],
      order: [["createdAt", "DESC"]],
    });
    const jobIds = companyJobs.map((j) => j.id);

    // boundary untuk bulan kalender saat ini
    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    );
    const startOfNextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
      0,
      0,
      0,
      0
    );

    // JOB STATS
    const jobCount = companyJobs.length;
    const thisMonthJobCount = await Job.count({
      where: {
        companyId: company.id,
        createdAt: { [Op.gte]: startOfMonth, [Op.lt]: startOfNextMonth },
      },
    });

    const newestOpenJobs = await Job.findAll({
      where: {
        companyId: company.id,
        status: "open",
      },
      order: [["createdAt", "DESC"]],
      limit: 4,
      attributes: [
        "id",
        "title",
        "startDate",
        "endDate",
        "status",
        "address",
        "createdAt",
      ],
    });

    // APPLICATION STATS (exclude status = 'withdrawn')
    let applicationCount = 0;
    let thisMonthApplicationCount = 0;
    let newestApplications = [];
    let mostPopularJob = null;

    if (jobIds.length > 0) {
      const nonWithdrawnWhere = {
        jobId: { [Op.in]: jobIds },
        status: { [Op.ne]: "withdrawn" },
      };

      applicationCount = await JobApplication.count({
        where: nonWithdrawnWhere,
      });

      thisMonthApplicationCount = await JobApplication.count({
        where: {
          ...nonWithdrawnWhere,
          appliedAt: { [Op.gte]: startOfMonth, [Op.lt]: startOfNextMonth },
        },
      });

      // newest applications (non-withdrawn)
      const rawNewestApps = await JobApplication.findAll({
        where: nonWithdrawnWhere,
        order: [["appliedAt", "DESC"]],
        limit: 4,
        attributes: ["id", "jobId", "userId", "status", "message", "appliedAt"],
        include: [
          {
            model: Job,
            attributes: ["id", "title"],
            required: false,
          },
          {
            model: User,
            attributes: ["id", "profilePicture", "username"],
            required: false,
          },
        ],
      });

      newestApplications = rawNewestApps.map((a) => ({
        id: a.id,
        jobId: a.jobId,
        jobTitle: a.Job ? a.Job.title : null,
        username: a.User ? a.User.username : null,
        userProfilePicture: a.User ? a.User.profilePicture : null,
        userId: a.userId,
        status: a.status,
        message: a.message,
        appliedAt: a.appliedAt,
      }));

      // most popular job: agregasi di JobApplication (exclude withdrawn)
      const popularByJob = await JobApplication.findAll({
        where: nonWithdrawnWhere,
        attributes: ["jobId", [fn("COUNT", col("id")), "applicationCount"]],
        group: ["jobId"],
        order: [[literal("applicationCount"), "DESC"]],
        limit: 1,
      });

      if (popularByJob && popularByJob.length > 0) {
        const top = popularByJob[0];
        const topJobId = top.get("jobId");
        const appCount = parseInt(top.get("applicationCount"), 10) || 0;

        const topJob = await Job.findOne({
          where: { id: topJobId },
          attributes: ["id", "title"],
        });

        mostPopularJob = topJob
          ? { id: topJob.id, title: topJob.title, applicationCount: appCount }
          : { id: topJobId, title: null, applicationCount: appCount };
      } else {
        mostPopularJob = null;
      }
    } else {
      // tidak ada job
      applicationCount = 0;
      thisMonthApplicationCount = 0;
      newestApplications = [];
      mostPopularJob = null;
    }

    return res.status(200).json({
      success: true,
      data: {
        job: {
          jobCount,
          thisMonthJobCount,
          newestOpenJobs,
          mostPopularJob,
        },
        application: {
          applicationCount,
          thisMonthApplicationCount,
          newestApplications,
        },
      },
    });
  } catch (error) {
    console.error("getCompanyOverviewStats error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// job-seeker application statistics
exports.getJsApplicationStats = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const baseWhere = {
      userId,
    };

    // TOTAL
    const jsTotalApplicationCount = await JobApplication.count({
      where: baseWhere,
    });

    // BY STATUS
    const [
      jsReviewedApplicationCount,
      jsAcceptedApplicationCount,
      jsRejectedApplicationCount,
    ] = await Promise.all([
      JobApplication.count({
        where: { ...baseWhere, status: "reviewed" },
      }),
      JobApplication.count({
        where: { ...baseWhere, status: "accepted" },
      }),
      JobApplication.count({
        where: { ...baseWhere, status: "rejected" },
      }),
    ]);

    // BULAN INI
    const thisMonthApplicationCount = await JobApplication.count({
      where: {
        ...baseWhere,
        appliedAt: {
          [Op.gte]: startOfMonth,
          [Op.lt]: startOfNextMonth,
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        jsTotalApplicationCount,
        jsReviewedApplicationCount,
        jsAcceptedApplicationCount,
        jsRejectedApplicationCount,
        thisMonthApplicationCount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};