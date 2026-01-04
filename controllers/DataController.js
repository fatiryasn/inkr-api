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
  JobDisability,
  UserDisability,
  JobSkill,
  UserSkill,
  RegisterRequest,
  UserSuspend,
} = require("../models");
const sequelize = require("../config/database");

/*
  DICTIONARY
*/
//get dictionaries (industries, disabilities, skills)
exports.getDictionaries = async (req, res) => {
  try {
    //queries
    let { search, page = "1", limit = "30", type } = req.query;

    page = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.min(
      [30, 50, 80].includes(parseInt(limit, 10)) ? parseInt(limit, 10) : 30,
      80
    );
    const offset = (page - 1) * limit;

    const allowedTypes = ["industry", "disability", "skill"];
    if (type && !allowedTypes.includes(type)) {
      type = null;
    }

    //search cond
    const searchCondition = search
      ? {
          name: { [Op.like]: `%${search.trim()}%` },
        }
      : {};

    let results = [];
    let totalCount = 0;

    //get usage counts func
    const getUsageCounts = async (items, itemType) => {
      return Promise.all(
        items.map(async (item) => {
          let usageInJob = 0;
          let usageInProfile = 0;
          let usageInCompany = 0;

          switch (itemType) {
            case "industry":
              usageInCompany = await Company.count({
                where: { industryId: item.id },
              });
              break;
            case "disability":
              usageInJob = await JobDisability.count({
                where: { disabilityId: item.id },
              });
              usageInProfile = await UserDisability.count({
                where: { disabilityId: item.id },
              });
              break;
            case "skill":
              usageInJob = await JobSkill.count({
                where: { skillId: item.id },
              });
              usageInProfile = await UserSkill.count({
                where: { skillId: item.id },
              });
              break;
          }

          return {
            id: item.id,
            name: item.name,
            type: itemType,
            usageInJob,
            usageInProfile,
            usageInCompany,
            ...(itemType === "disability" && { disabilityType: item.type }),
          };
        })
      );
    };

    if (!type) {
      //get all dicts
      const [industries, disabilities, skills] = await Promise.all([
        Industry.findAll({
          where: searchCondition,
          limit,
          offset,
          order: [["name", "ASC"]],
        }),
        Disability.findAll({
          where: searchCondition,
          limit,
          offset,
          order: [["name", "ASC"]],
        }),
        Skill.findAll({
          where: searchCondition,
          limit,
          offset,
          order: [["name", "ASC"]],
        }),
      ]);

      //count for pagination
      const [industryCount, disabilityCount, skillCount] = await Promise.all([
        Industry.count({ where: searchCondition }),
        Disability.count({ where: searchCondition }),
        Skill.count({ where: searchCondition }),
      ]);

      totalCount = industryCount + disabilityCount + skillCount;

      //get usage each
      const [industryResults, disabilityResults, skillResults] =
        await Promise.all([
          getUsageCounts(industries, "industry"),
          getUsageCounts(disabilities, "disability"),
          getUsageCounts(skills, "skill"),
        ]);

      //combine & sort
      results = [...industryResults, ...disabilityResults, ...skillResults];
      results.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      //filter type
      let items, count;

      switch (type) {
        case "industry":
          items = await Industry.findAll({
            where: searchCondition,
            limit,
            offset,
            order: [["name", "ASC"]],
          });
          count = await Industry.count({ where: searchCondition });
          break;
        case "disability":
          items = await Disability.findAll({
            where: searchCondition,
            limit,
            offset,
            order: [["name", "ASC"]],
          });
          count = await Disability.count({ where: searchCondition });
          break;
        case "skill":
          items = await Skill.findAll({
            where: searchCondition,
            limit,
            offset,
            order: [["name", "ASC"]],
          });
          count = await Skill.count({ where: searchCondition });
          break;
      }

      totalCount = count;
      results = await getUsageCounts(items, type);
    }

    const totalPages = Math.ceil(totalCount / limit);

    return res.json({
      success: true,
      data: results,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages,
        filters: {
          availableTypes: allowedTypes,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
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
      message: error.message || "Internal server error",
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
      message: error.message || "Internal server error",
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
      message: error.message || "Internal server error",
    });
  }
};
//add new dictionary
exports.addNewDictionary = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { name, type, disabilityType } = req.body;

    // check duplicate name
    let existingItem;
    switch (type) {
      case "industry":
        existingItem = await Industry.findOne({
          where: sequelize.where(
            sequelize.fn("LOWER", sequelize.col("name")),
            name
          ),
          transaction,
        });
        break;
      case "disability":
        existingItem = await Disability.findOne({
          where: sequelize.where(
            sequelize.fn("LOWER", sequelize.col("name")),
            name
          ),
          transaction,
        });
        break;
      case "skill":
        existingItem = await Skill.findOne({
          where: sequelize.where(
            sequelize.fn("LOWER", sequelize.col("name")),
            name
          ),
          transaction,
        });
        break;
      default:
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Tipe tidak valid",
        });
    }

    if (existingItem) {
      await transaction.rollback();
      const typeLabels = {
        industry: "Industri",
        disability: "Disabilitas",
        skill: "Skill",
      };
      return res.status(400).json({
        success: false,
        message: `${typeLabels[type]} dengan nama tersebut sudah ada`,
      });
    }

    //item creation
    let newItem;

    switch (type) {
      case "industry":
        newItem = await Industry.create(
          {
            name,
          },
          { transaction }
        );
        break;
      case "disability":
        newItem = await Disability.create(
          {
            name,
            type: disabilityType.toLowerCase(),
          },
          { transaction }
        );
        break;
      case "skill":
        newItem = await Skill.create(
          {
            name,
          },
          { transaction }
        );
        break;
    }

    await transaction.commit();

    //response
    const response = {
      id: newItem.id,
      name: newItem.name,
      type: type,
    };
    if (type === "disability") {
      response.disabilityType = newItem.type;
    }

    return res.status(201).json({
      success: true,
      message: "Dictionary baru berhasil ditambahkan",
      data: response,
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
//delete dictionary
exports.deleteDictionary = async (req, res) => {
  const transaction = await sequelize.transaction();
  const typeLabels = {
    industry: "Industri",
    disability: "Disabilitas",
    skill: "Skill",
  };

  try {
    const { id, type } = req.params;

    if (!id || !type) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "ID dan tipe dictionary tidak valid",
      });
    }

    //type validation
    if (!["industry", "disability", "skill"].includes(type)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Tipe tidak vali",
      });
    }

    let item;

    //find item
    switch (type) {
      case "industry":
        item = await Industry.findByPk(id, { transaction });
        break;
      case "disability":
        item = await Disability.findByPk(id, { transaction });
        break;
      case "skill":
        item = await Skill.findByPk(id, { transaction });
        break;
    }

    if (!item) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: `${typeLabels[type]} tidak ditemukan`,
      });
    }

    //delete
    await item.destroy({ transaction });
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: `${typeLabels[type]} berhasil dihapus`,
      data: {
        id: item.id,
        name: item.name,
        type: type,
      },
    });
  } catch (error) {
    await transaction.rollback();

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/*
  PREVIEWS
*/
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
      accountStatus: "active",
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
          attributes: ["companyName", "industryId"],
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

    //randomize
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
      message: error.message || "Internal server error",
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

    //where clause job
    const where = {
      status: "open",
    };

    if (excludeIds.length > 0) {
      where.id = {
        [Op.notIn]: excludeIds,
      };
    }

    //randomize
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
        "startDate",
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
      message: error.message || "Internal server error",
    });
  }
};

/*
  STATISTICS
*/
//overview statistics
exports.getCompanyOverviewStats = async (req, res) => {
  try {
    const authUserId = req.user.id;

    const company = await Company.findOne({ where: { userId: authUserId } });
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Perusahaan tidak ditemukan" });
    }

    //company's job
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

    //calendar filter
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

    // APPLICATION STATS
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
          createdAt: { [Op.gte]: startOfMonth, [Op.lt]: startOfNextMonth },
        },
      });

      // newest applications
      const rawNewestApps = await JobApplication.findAll({
        where: nonWithdrawnWhere,
        order: [["createdAt", "DESC"]],
        limit: 4,
        attributes: ["id", "jobId", "userId", "status", "message", "createdAt"],
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
        createdAt: a.createdAt,
      }));

      // most popular job
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
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
//job-seeker application statistics
exports.getJsApplicationStats = async (req, res) => {
  try {
    const userId = req.user.id

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

    //THIS MONTH
    const thisMonthApplicationCount = await JobApplication.count({
      where: {
        ...baseWhere,
        createdAt: {
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
//get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const requestingUser = req.user;

    const [userCounts, dictionaryCounts, lists, totalSuspendLog] =
      await Promise.all([
        //user counts
        Promise.all([
          User.count({
            where: {
              accountStatus: "active",
              role: { [Op.notIn]: ["admin", "super-admin"] },
            },
          }),
          RegisterRequest.count({
            where: { status: "pending" },
          }),
        ]),

        //dictionary counts
        Promise.all([Industry.count(), Disability.count(), Skill.count()]),

        //lists
        Promise.all([
          User.findAll({
            where: { role: "company" },
            include: [
              {
                model: Company,
                attributes: ["companyName", "country", "city"],
              },
            ],
            order: [["createdAt", "DESC"]],
            limit: 5,
            attributes: [
              "id",
              "username",
              "email",
              "createdAt",
              "profilePicture",
              "accountStatus",
            ],
          }),
          User.findAll({
            where: { role: "job-seeker" },
            include: [
              {
                model: UserProfile,
                attributes: ["fullName", "country", "city", "gender"],
              },
            ],
            order: [["createdAt", "DESC"]],
            limit: 5,
            attributes: [
              "id",
              "username",
              "email",
              "createdAt",
              "profilePicture",
              "accountStatus",
            ],
          }),
        ]),

        //suspend log
        (async () => {
          let suspendWhereClause = {};
          if (requestingUser.role !== "super-admin") {
            suspendWhereClause = {
              "$User.role$": { [Op.notIn]: ["admin", "super-admin"] },
            };
          }
          return await UserSuspend.count({
            include: [
              {
                model: User,
                as: "User",
                attributes: [],
                required: true,
              },
            ],
            where: suspendWhereClause,
          });
        })(),
      ]);

    const [totalActiveUser, totalInboxRegister] = userCounts;
    const [totalIndustry, totalDisability, totalSkill] = dictionaryCounts;
    const [newestCompanies, newestJobSeekers] = lists;
    const totalDictionary = totalIndustry + totalDisability + totalSkill;

    return res.status(200).json({
      success: true,
      data: {
        totalActiveUser,
        totalInboxRegister,
        totalSuspendLog,
        totalDictionary,
        newestCompanies,
        newestJobSeekers,
        dictionaryBreakdown: {
          industries: totalIndustry,
          disabilities: totalDisability,
          skills: totalSkill,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
//users statistics
exports.getUserStats = async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(
      currentYear,
      currentMonth + 1,
      0,
      23,
      59,
      59,
      999
    );

    //conditions
    const notAdminCondition = {
      role: { [Op.notIn]: ["admin", "super-admin"] },
    };

    const thisMonthCondition = {
      ...notAdminCondition,
      createdAt: { [Op.between]: [startOfMonth, endOfMonth] },
    };

    const activeUsersCondition = {
      ...notAdminCondition,
      accountStatus: "active",
    };

    //execute
    const [
      totalUsers,
      thisMonthTotalUsers,
      totalActiveUsers,
      totalJobSeekers,
      totalCompanies,
    ] = await Promise.all([
      User.count({ where: notAdminCondition }),
      User.count({ where: thisMonthCondition }),
      User.count({ where: activeUsersCondition }),
      User.count({ where: { role: "job-seeker" } }),
      User.count({ where: { role: "company" } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        thisMonthTotalUsers,
        totalActiveUsers,
        totalJobSeekers,
        totalCompanies,
        month: now.toLocaleString("default", { month: "long" }),
        year: currentYear,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
