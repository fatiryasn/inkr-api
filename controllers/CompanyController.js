const sequelize = require("../configs/database");
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
const {
  Op,
  fn,
  col,
  where: sequelizeWhere,
  literal,
  where,
} = require("sequelize");

const ALLOWED_LIMITS = [30, 50, 80];
const ALLOWED_STATUSES = ["pending", "open", "closed", "cancelled"];

//get companies
exports.getCompanies = async (req, res) => {
  try {
    const {
      search,
      mustSearch,
      page = "1",
      limit = "30",
      country,
      industryId,
    } = req.query;

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

    //where clause
    const companyWhere = {};

    if (country && String(country).trim() !== "") {
      companyWhere.country = String(country).trim();
    }

    if (industryId && !Number.isNaN(parseInt(industryId, 10))) {
      companyWhere.industryId = parseInt(industryId, 10);
    }

    if (search && String(search).trim() !== "") {
      const q = String(search).trim().toLowerCase();
      const nameCond = sequelizeWhere(fn("LOWER", col("Company.companyName")), {
        [Op.like]: `%${q}%`,
      });
      const descCond = sequelizeWhere(
        fn("LOWER", col("Company.companyDescription")),
        {
          [Op.like]: `%${q}%`,
        }
      );
      companyWhere[Op.and] = [
        {
          [Op.or]: [nameCond, descCond],
        },
      ];
    }

    const userWhere = {
      isVerified: true,
      isActive: true,
      isComplete: true,
    };

    const offset = (parsedPage - 1) * parsedLimit;

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
          required: false,
        },
      ],
      order: [["companyName", "ASC"]],
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
    // safety check untuk req.user
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: user not found" });
    }

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

    // count of applications (literal)
    const applicationsCountLiteral = literal(
      `(SELECT COUNT(*) 
    FROM job_applications 
    WHERE job_applications.jobId = Job.id
    AND job_applications.status != 'withdrawn')`
    );

    // include di count hanya bila diperlukan (mis. filter required)
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
    console.error("getCompanyJobs error:", error);
    return res.status(500).json({ success: false, message: error.message });
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

    // cari company berdasarkan userId (pemilik company)
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Perusahaan tidak ditemukan untuk user ini",
      });
    }

    // build Job where: wajib companyId = company.id
    const jobWhere = {
      companyId: company.id,
    };

    // application where clause dasar (filter status jika ada)
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
      message: "Berhasil mendapatkan data aplikasi perusahaan",
      meta: { page, limit, total: totalCount, totalPages },
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// update company profile
exports.cmProfileUpdate = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const user = req.dbUser;

    if (user.role !== "company") {
      await t.rollback();
      return res.status(403).json({
        success: false,
        message: "User bukan perusahaan",
      });
    }

    let company = await Company.findOne({ where: { userId }, transaction: t });

    if (!company) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Data perusahaan tidak ditemukan",
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
    let finalIndustryName = null;

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
        finalIndustryName = industry.name;
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
        finalIndustryName = existing.name;
      }

      if (!finalIndustryName) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Nama industri tidak valid",
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
      updatedData.industryName = finalIndustryName;
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
      message: error.message,
    });
  }
};
