const { Op, fn, col, where, literal } = require("sequelize");
const sequelize = require("../config/database");
const {
  Company,
  Industry,
  User,
  Job,
  JobSkill,
  JobDisability,
  JobApplication,
  UserProfile,
} = require("../models");

//get companies
exports.getCompanies = async (req, res) => {
  try {
    //queries
    const { search, mustSearch, page = "1", limit = "30", country } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    let parsedLimit = parseInt(limit, 10) || 30;
    const allowedLimits = [30, 50, 80];
    if (!allowedLimits.includes(parsedLimit)) parsedLimit = 30;

    const isMustSearch = mustSearch === true || mustSearch === "true";

    if (isMustSearch && (!search || String(search).trim() === "")) {
      return res.json({
        success: true,
        data: [],
        meta: {
          total: 0,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: 0,
        },
      });
    }

    // where clause
    const companyWhere = {};

    if (country && String(country).trim() !== "") {
      companyWhere.country = String(country).trim().toLowerCase();
    }

    if (search && String(search).trim() !== "") {
      const q = String(search).trim().toLowerCase();
      const nameCond = where(fn("LOWER", col("Company.companyName")), {
        [Op.like]: `%${q}%`,
      });
      const descCond = where(fn("LOWER", col("Company.companyDescription")), {
        [Op.like]: `%${q}%`,
      });
      const industryCond = where(fn("LOWER", col("Industry.name")), {
        [Op.like]: `%${q}%`,
      });

      companyWhere[Op.and] = [
        {
          [Op.or]: [nameCond, descCond, industryCond],
        },
      ];
    }
    const userWhere = {
      accountStatus: "active",
    };

    const offset = (parsedPage - 1) * parsedLimit;

    //result
    const jobCountSubquery = `(SELECT COUNT(*) FROM jobs WHERE jobs.companyId = Company.id AND jobs.status = 'open')`;

    const result = await Company.findAndCountAll({
      where: companyWhere,
      include: [
        {
          model: User,
          attributes: ["id", "username", "profilePicture"],
          where: userWhere,
          required: true,
        },
        {
          model: Industry,
          attributes: ["id", "name"],
        },
      ],
      attributes: {
        include: [[literal(jobCountSubquery), "jobCounts"]],
      },
      order: [["updatedAt", "DESC"]],
      limit: parsedLimit,
      offset,
      distinct: true,
    });

    const total = result.count || 0;
    const rows = result.rows || [];
    const totalPages = parsedLimit > 0 ? Math.ceil(total / parsedLimit) : 0;

    return res.json({
      success: true,
      data: rows,
      meta: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

//get company's job
exports.getCompanyJobs = async (req, res) => {
  try {
    const ALLOWED_STATUSES = ["pending", "open", "closed", "cancelled"];
    const ALLOWED_LIMITS = [30, 50, 80];

    const userId = Number(req.user.id);
    if (!userId || Number.isNaN(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "ID perusahaan tidak ditemukan" });
    }

    const company = await Company.findOne({
      where: { userId },
      attributes: ["id", "companyName", "country", "city"],
      include: [
        {
          model: User,
          attributes: ["id", "profilePicture"],
        },
      ],
    });
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Perusahaan tidak ditemukan" });
    }

    // pagination
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limitRequested = parseInt(
      req.query.limit || String(ALLOWED_LIMITS[0]),
      10
    );
    const limit = ALLOWED_LIMITS.includes(limitRequested)
      ? limitRequested
      : ALLOWED_LIMITS[0];
    const offset = (page - 1) * limit;

    // search
    const search = req.query.search ? String(req.query.search).trim() : null;

    // status filtering
    let status = req.query.status ? String(req.query.status).trim() : null;
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status value. Allowed: ${ALLOWED_STATUSES.join(
          ", "
        )}`,
      });
    }

    // disability type filtering
    let disabilityTypesParam = req.query.disabilityTypes
      ? String(req.query.disabilityTypes).trim()
      : null;
    let disabilityTypes = null;
    if (disabilityTypesParam) {
      disabilityTypes = disabilityTypesParam
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }

    // sort
    const sortParam = String(req.query.sort || "newest").toLowerCase();
    let order = [["createdAt", "DESC"]];
    if (sortParam === "az") order = [["title", "ASC"]];
    else if (sortParam === "za") order = [["title", "DESC"]];
    else if (sortParam === "oldest") order = [["createdAt", "ASC"]];

    const jobWhere = { companyId: company.id };
    if (status) jobWhere.status = status;

    if (search) {
      jobWhere[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    // includes
    const skillInclude = {
      model: JobSkill,
      attributes: ["skillId", "skillName"],
      required: false,
    };
    const jobDisabilityInclude = {
      model: JobDisability,
      attributes: ["disabilityId", "disabilityName", "type"],
      required: false,
    };
    if (disabilityTypes && disabilityTypes.length) {
      jobDisabilityInclude.required = true;
      jobDisabilityInclude.where = { type: { [Op.in]: disabilityTypes } };
    }

    // count of applications
    const applicationsCountLiteral = literal(
      `(SELECT COUNT(*) 
    FROM job_applications 
    WHERE job_applications.jobId = Job.id
    AND job_applications.status != 'withdrawn')`
    );

    const countIncludes = [];
    if (jobDisabilityInclude.required) countIncludes.push(jobDisabilityInclude);

    const total = await Job.count({
      where: jobWhere,
      include: countIncludes,
      distinct: true,
    });

    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

    const jobs = await Job.findAll({
      where: jobWhere,
      include: [skillInclude, jobDisabilityInclude],
      attributes: {
        include: [[applicationsCountLiteral, "applicationsCount"]],
      },
      order,
      limit,
      offset,
      distinct: true,
    });

    return res.json({
      success: true,
      meta: { page, limit, total, totalPages },
      company,
      currentPageTotal: jobs.length,
      data: jobs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

//get company's application
exports.getCompanyApplication = async (req, res) => {
  try {
    const ALLOWED_STATUS = ["applied", "reviewed", "accepted", "rejected"];
    const ALLOWED_LIMITS = [30, 50, 80];
    const SORT_OPTIONS = {
      newest: [["appliedAt", "DESC"]],
      oldest: [["appliedAt", "ASC"]],
    };

    // queries
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limitRequested = parseInt(
      req.query.limit || String(ALLOWED_LIMITS[0]),
      10
    );
    const limit = ALLOWED_LIMITS.includes(limitRequested)
      ? limitRequested
      : ALLOWED_LIMITS[0];
    const offset = (page - 1) * limit;

    const status = req.query.status ? String(req.query.status) : null;
    const search = req.query.search ? String(req.query.search).trim() : null;
    const sort =
      req.query.sort && SORT_OPTIONS[req.query.sort]
        ? req.query.sort
        : "newest";

    // validasi status
    if (status && !ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status tidak valid. Status yang diperbolehkan: ${ALLOWED_STATUS.join(
          ", "
        )}`,
      });
    }

    //find company
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Perusahaan tidak ditemukan",
      });
    }

    //job where
    const jobWhere = {
      companyId: company.id,
    };

    //application where
    const applicationWhere = {
      status: {
        [Op.ne]: "withdrawn",
        ...(status ? { [Op.eq]: status } : {}),
      },
    };

    const includes = [
      {
        model: Job,
        attributes: [
          "id",
          "companyId",
          "title",
          "description",
          "status",
          "startDate",
          "endDate",
          "employmentType",
          "locationType",
        ],
        required: true,
        where: jobWhere,
        include: [
          {
            model: Company,
            attributes: ["id", "companyName"],
          },
        ],
      },
      {
        model: User,
        attributes: ["id", "username", "profilePicture", "email"],
        required: true,
        include: [
          {
            model: UserProfile,
            attributes: ["id", "fullName"],
          },
        ],
      },
    ];

    //search
    if (search) {
      const likeValue = `%${search.toLowerCase()}%`;

      applicationWhere[Op.and] = applicationWhere[Op.and] || [];
      applicationWhere[Op.and].push({
        [Op.or]: [
          where(fn("LOWER", col("Job.title")), { [Op.like]: likeValue }),
          where(fn("LOWER", col("Job.description")), { [Op.like]: likeValue }),
          where(fn("LOWER", col("User.username")), { [Op.like]: likeValue }),
          where(fn("LOWER", col("User->UserProfile.fullName")), {
            [Op.like]: likeValue,
          }),
        ],
      });
    }

    const totalCount = await JobApplication.count({
      where: applicationWhere,
      include: includes,
      distinct: true,
    });

    const rows = await JobApplication.findAll({
      where: applicationWhere,
      include: includes,
      order: SORT_OPTIONS[sort],
      limit,
      offset,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      meta: { page, limit, total: totalCount, totalPages },
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

//js application preview
exports.getJsApplicationPreview = async (req, res) => {
  try {
    const jsId = req.params.jsId;
    const userId = req.user.id;

    const company = await Company.findOne({
      where: { userId },
      attributes: ["id", "companyName"],
      include: [
        {
          model: User,
          attributes: ["id", "profilePicture", "username"],
        },
      ],
    });

    if (!company) {
      return res.status(403).json({
        success: false,
        message: "Perusahaan tidak ditemukan",
      });
    }

    //find
    const applications = await JobApplication.findAll({
      where: {
        userId: jsId,
        status: { [Op.ne]: "withdrawn" },
      },
      attributes: ["id", "status", "appliedAt"],
      include: [
        {
          model: Job,
          where: { companyId: company.id },
          attributes: [
            "id",
            "title",
            "companyId",
            "employmentType",
            "locationType",
            "status",
          ],
          required: true,
        },
      ],
      order: [["appliedAt", "DESC"]],
      limit: 3,
    });

    return res.json({
      success: true,
      data: {
        applications,
        company,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// update company profile
exports.cmProfileUpdate = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const userId = req.user.id;

    let company = await Company.findOne({ where: { userId }, transaction: t });

    if (!company) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Perusahaan tidak ditemukan",
      });
    }

    const {
      companyName,
      companyDescription,
      country,
      city,
      address,
      establishedYear,
      industryId,
      industryName,
      websiteLink,
    } = req.body;

    let finalIndustryId = null;

    const isUpdatingIndustry =
      req.body.hasOwnProperty("industryId") ||
      req.body.hasOwnProperty("industryName");

    if (isUpdatingIndustry) {
      if (industryId) {
        const industry = await Industry.findByPk(industryId, {
          transaction: t,
        });
        if (!industry) {
          await t.rollback();
          return res.status(400).json({
            success: false,
            message: "ID industri tidak ditemukan",
          });
        }
        finalIndustryId = industry.id;
      }

      if (!industryId && industryName) {
        let existing = await Industry.findOne({
          where: { name: industryName },
          transaction: t,
        });
        if (!existing) {
          existing = await Industry.create(
            { name: industryName },
            { transaction: t }
          );
        }
        finalIndustryId = existing.id;
      }

      if (!finalIndustryId) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Industri tidak valid",
        });
      }
    }

    const updatedData = {};

    if (companyName !== undefined) updatedData.companyName = companyName;
    if (companyDescription !== undefined)
      updatedData.companyDescription = companyDescription;
    if (country !== undefined) updatedData.country = country;
    if (city !== undefined) updatedData.city = city;
    if (address !== undefined) updatedData.address = address;
    if (establishedYear !== undefined)
      updatedData.establishedYear = establishedYear;

    if (isUpdatingIndustry) {
      updatedData.industryId = finalIndustryId;
    }

    if (websiteLink !== undefined) updatedData.websiteLink = websiteLink;

    await company.update(updatedData, { transaction: t });

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Profil perusahaan berhasil diperbarui",
      data: company,
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
