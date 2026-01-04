const { Op, where, fn, col } = require("sequelize");
const sequelize = require("../config/database");
const {
  UserProfile,
  UserEducation,
  UserExperience,
  UserDisability,
  UserSkill,
  Company,
  Skill,
  Disability,
  User,
  JobApplication,
  Job,
} = require("../models");
const { deleteUserDetail } = require("../utils/deleteUserDetails");

//get jobseekers
exports.getJobSeekers = async (req, res) => {
  try {
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
    const jobSeekerWhere = {};

    if (country && String(country).trim() !== "") {
      jobSeekerWhere.country = String(country).trim().toLowerCase();
    }

    if (search && String(search).trim() !== "") {
      const q = String(search).trim().toLowerCase();
      const nameCond = where(fn("LOWER", col("UserProfile.fullName")), {
        [Op.like]: `%${q}%`,
      });
      const descCond = where(fn("LOWER", col("UserProfile.bio")), {
        [Op.like]: `%${q}%`,
      });
      const usernameCond = where(fn("LOWER", col("User.username")), {
        [Op.like]: `%${q}%`,
      });
      jobSeekerWhere[Op.and] = [
        {
          [Op.or]: [nameCond, descCond, usernameCond],
        },
      ];
    }

    const userWhere = {
      accountStatus: "active",
      role: "job-seeker",
    };

    const offset = (parsedPage - 1) * parsedLimit;

    const result = await User.findAndCountAll({
      where: userWhere,
      include: [
        {
          model: UserProfile,
          where: jobSeekerWhere,
          required: true,
        },
        {
          model: UserDisability,
          attributes: ["id"],
          include: [
            {
              model: Disability,
              attributes: ["name", "type"],
            },
          ],
        },
        {
          model: UserSkill,
          attributes: ["id"],
          include: [
            {
              model: Skill,
              attributes: ["name"],
            },
          ],
        },
      ],
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

// update job seeker profile (+admins)
exports.jsProfileUpdate = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await UserProfile.findOne({ where: { userId } });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profil pengguna tidak ditemukan",
      });
    }

    const allowedFields = [
      "fullName",
      "phoneNumber",
      "bio",
      "country",
      "city",
      "address",
      "gender",
      "dateOfBirth",
    ];

    const updatedData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updatedData[field] = req.body[field];
      }
    }

    await profile.update(updatedData);

    return res.status(200).json({
      success: true,
      message: "Profil pengguna berhasil diperbarui",
      data: profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// get job seeker educations
exports.getJsEducations = async (req, res) => {
  try {
    const { userId } = req.params;
    let { page = 1, search = "" } = req.query;
    page = parseInt(page) || 1;

    const limit = 10;
    const offset = (page - 1) * limit;

    const whereCondition = { userId };

    if (search.trim() !== "") {
      whereCondition[Op.or] = [
        { institutionName: { [Op.like]: `%${search}%` } },
        { fieldOfStudy: { [Op.like]: `%${search}%` } },
        { degree: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await UserEducation.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [["startDate", "DESC"]],
      include: [
        {
          model: Company,
          attributes: ["id", "companyName"],
          include: [
            {
              model: User,
              attributes: ["id", "profilePicture"],
            },
          ],
        },
      ],
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      success: true,
      data: rows,
      meta: { page, limit, total: count, totalPages },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
// get job seeker experiences
exports.getJsExperiences = async (req, res) => {
  try {
    const { userId } = req.params;
    let { page = 1, search = "" } = req.query;
    page = parseInt(page) || 1;

    const limit = 10;
    const offset = (page - 1) * limit;

    const whereCondition = { userId };

    if (search.trim() !== "") {
      whereCondition[Op.or] = [
        { companyName: { [Op.like]: `%${search}%` } },
        { position: { [Op.like]: `%${search}%` } },
        { experienceType: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await UserExperience.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [["startDate", "DESC"]],
      include: [
        {
          model: Company,
          attributes: ["id", "companyName"],
          include: [
            {
              model: User,
              attributes: ["id", "profilePicture"],
            },
          ],
        },
      ],
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      success: true,
      data: rows,
      meta: { page, limit, total: count, totalPages },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
//get job seeker skills
exports.getJsSkills = async (req, res) => {
  try {
    const { userId } = req.params;
    let { page = 1, search = "" } = req.query;

    page = parseInt(page) || 1;

    const limit = 10;
    const offset = (page - 1) * limit;

    const whereCondition = { userId };

    if (search.trim() !== "") {
      whereCondition[Op.or] = [{ skillName: { [Op.like]: `%${search}%` } }];
    }

    const { count, rows } = await UserSkill.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [["id", "DESC"]],
      include: [
        {
          model: Skill,
        },
      ],
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      success: true,
      data: rows,
      meta: { page, limit, total: count, totalPages },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
//get job seeker disabilities
exports.getJsDisabilities = async (req, res) => {
  try {
    const { userId } = req.params;
    let { page = 1, search = "" } = req.query;

    page = parseInt(page) || 1;

    const limit = 10;
    const offset = (page - 1) * limit;

    const whereCondition = { userId };

    if (search.trim() !== "") {
      whereCondition[Op.or] = [
        { disabilityName: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await UserDisability.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [["id", "DESC"]],
      include: [
        {
          model: Disability,
        },
      ],
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      success: true,
      data: rows,
      meta: { page, limit, total: count, totalPages },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// add job seeker education
exports.addJsEducation = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      institutionId,
      institutionName,
      fieldOfStudy,
      degree,
      score,
      startDate,
      endDate,
      description,
    } = req.body;

    let finalInstitutionId = null;
    let finalInstitutionName = null;

    if (institutionId) {
      const company = await Company.findByPk(institutionId);
      if (!company) {
        return res.status(400).json({
          success: false,
          message: "ID institusi (company) tidak ditemukan",
        });
      }

      finalInstitutionId = institutionId;
      finalInstitutionName = company.companyName;
    }

    if (!institutionId && institutionName) {
      finalInstitutionName = institutionName;
    }

    if (!finalInstitutionName) {
      return res.status(400).json({
        success: false,
        message: "Nama institusi tidak valid",
      });
    }

    const educationData = {
      userId,
      institutionId: finalInstitutionId,
      institutionName: finalInstitutionName,
      fieldOfStudy,
      degree,
      score:
        score !== undefined && score !== null && score !== "" ? score : null,
      startDate,
      endDate: endDate || null,
      description: description || null,
    };

    const newEducation = await UserEducation.create(educationData);

    return res.status(201).json({
      success: true,
      message: "Pendidikan baru berhasil ditambahkan",
      data: newEducation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
// add job seeker experience
exports.addJsExperience = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      companyId,
      companyName,
      experienceType,
      position,
      startDate,
      endDate,
      description,
    } = req.body;

    let finalCompanyId = null;
    let finalCompanyName = null;

    if (companyId) {
      const company = await Company.findByPk(companyId);

      if (!company) {
        return res.status(400).json({
          success: false,
          message: "ID perusahaan tidak ditemukan",
        });
      }

      finalCompanyId = companyId;
      finalCompanyName = company.companyName;
    }

    if (!companyId && companyName) {
      finalCompanyName = companyName;
    }

    if (!finalCompanyName) {
      return res.status(400).json({
        success: false,
        message: "Nama perusahaan tidak valid",
      });
    }

    const experienceData = {
      userId,
      companyId: finalCompanyId,
      companyName: finalCompanyName,
      experienceType,
      position,
      startDate,
      endDate: endDate || null,
      description: description || null,
    };

    const newExperience = await UserExperience.create(experienceData);

    return res.status(201).json({
      success: true,
      message: "Pengalaman baru berhasil ditambahkan",
      data: newExperience,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
// add job seeker skill
exports.addJsSkill = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;

    const { skillId, skillName, description } = req.body;

    let finalSkillId = null;
    let finalSkillName = null;

    //given skillId
    if (skillId) {
      const skill = await Skill.findByPk(skillId, { transaction: t });
      if (!skill) {
        await t.rollback();
        return res
          .status(400)
          .json({ success: false, message: "ID skill tidak ditemukan" });
      }

      finalSkillId = skill.id;
      finalSkillName = skill.name;
    }

    //given skillName
    if (!skillId && skillName) {
      let skill = await Skill.findOne({
        where: { name: skillName },
        transaction: t,
      });

      if (!skill) {
        //create to SKILL
        skill = await Skill.create(
          {
            name: skillName,
          },
          { transaction: t }
        );
      }

      finalSkillId = skill.id;
      finalSkillName = skill.name;
    }

    if (!finalSkillName) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Nama skill tidak valid" });
    }

    const existing = await UserSkill.findOne({
      where: {
        userId,
        skillId: finalSkillId,
      },
      transaction: t,
    });

    if (existing) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Skill sudah ada di profil Anda" });
    }

    //create to USERSKILL
    const newUserSkill = await UserSkill.create(
      {
        userId,
        skillId: finalSkillId,
        description,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Skill baru berhasil ditambahkan",
      data: newUserSkill,
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
// add job seeker disability
exports.addJsDisability = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;

    const { disabilityId, disabilityName, type, description } = req.body;

    let finalDisabilityId = null;
    let finalDisabilityName = null;

    //given disabilityId
    if (disabilityId) {
      const dis = await Disability.findByPk(disabilityId, { transaction: t });
      if (!dis) {
        await t.rollback();
        return res
          .status(400)
          .json({ success: false, message: "ID disabilitas tidak ditemukan" });
      }
      finalDisabilityId = dis.id;
      finalDisabilityName = dis.name;
    }

    //given disabilityName
    if (!disabilityId && disabilityName) {
      let dis = await Disability.findOne({
        where: { name: disabilityName },
        transaction: t,
      });

      if (!dis) {
        if (!type) {
          await t.rollback();
          return res.status(400).json({
            success: false,
            message: "Field yang dibutuhkan masih belum lengkap",
          });
        }

        //create to DISABILITY
        dis = await Disability.create(
          { name: disabilityName, type },
          { transaction: t }
        );
      }

      finalDisabilityId = dis.id;
      finalDisabilityName = dis.name;
    }

    if (!finalDisabilityName) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Nama disabilitas tidak valid" });
    }

    const existing = await UserDisability.findOne({
      where: {
        userId,
        disabilityId: finalDisabilityId,
      },
      transaction: t,
    });

    if (existing) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Disabilitas sudah ada di profil Anda",
      });
    }

    //create to USERDISABILITY
    const newUserDisability = await UserDisability.create(
      {
        userId,
        disabilityId: finalDisabilityId,
        description,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Disabilitas baru berhasil ditambahkan",
      data: newUserDisability,
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

//delete job seeker education
exports.deleteJsEducation = async (req, res) => {
  try {
    const detailId = req.params.detailId;
    await deleteUserDetail(UserEducation, detailId, req.user.id);

    res.status(200).json({
      success: true,
      message: "Pendidikan berhasil dihapus",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
//delete job seeker experience
exports.deleteJsExperience = async (req, res) => {
  try {
    const detailId = req.params.detailId;
    await deleteUserDetail(UserExperience, detailId, req.user.id);

    res.status(200).json({
      success: true,
      message: "Pengalaman berhasil dihapus",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
//delete job seeker skill
exports.deleteJsSkill = async (req, res) => {
  try {
    const detailId = req.params.detailId;
    await deleteUserDetail(UserSkill, detailId, req.user.id);

    res.status(200).json({
      success: true,
      message: "Skill berhasil dihapus",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
//delete job seeker disability
exports.deleteJsDisability = async (req, res) => {
  try {
    const detailId = req.params.detailId;
    await deleteUserDetail(UserDisability, detailId, req.user.id);

    res.status(200).json({
      success: true,
      message: "Disabilitas berhasil dihapus",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

//get job seeker applications
exports.getJsApplications = async (req, res) => {
  try {
    const ALLOWED_STATUS = [
      "applied",
      "reviewed",
      "accepted",
      "rejected",
      "withdrawn",
    ];
    const ALLOWED_LIMITS = [30, 50, 80];
    const SORT_OPTIONS = {
      newest: [["createdAt", "DESC"]],
      oldest: [["createdAt", "ASC"]],
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
        message: `Status lamaran invalid (valid: ${ALLOWED_STATUS.join(", ")})`,
      });
    }

    // application where clause
    const applicationWhere = {
      userId: req.user.id,
      ...(status ? { status } : {}),
    };

    // build include
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
        include: [
          {
            model: Company,
            attributes: ["id", "userId", "companyName", "country", "city"],
            include: [
              {
                model: User,
                attributes: ["id", "username", "profilePicture"],
              },
            ],
          },
        ],
      },
    ];

    // search
    if (search) {
      const likeValue = `%${search.toLowerCase()}%`;
      applicationWhere[Op.and] = applicationWhere[Op.and] || [];
      applicationWhere[Op.and].push({
        [Op.or]: [
          where(fn("LOWER", col("Job.title")), { [Op.like]: likeValue }),
          where(fn("LOWER", col("Job.description")), {
            [Op.like]: likeValue,
          }),
          where(fn("LOWER", col("Job->Company.companyName")), {
            [Op.like]: likeValue,
          }),
        ],
      });
    }

    //find
    const { count, rows } = await JobApplication.findAndCountAll({
      where: applicationWhere,
      include: includes,
      order: SORT_OPTIONS[sort],
      limit,
      offset,
      distinct: true,
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      success: true,
      meta: { page, limit, total: count, totalPages },
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// withdraw application
exports.withdrawApplication = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const appId = Number(req.params.appId);

    if (!userId || !appId) {
      return res.status(400).json({
        success: false,
        message: "ID pengguna atau ID lamaran tidak valid",
      });
    }

    const application = await JobApplication.findOne({
      where: {
        id: appId,
        userId: userId,
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Lamaran tidak ditemukan",
      });
    }

    const currentStatus = String(application.status).toLowerCase();

    //withdrawn
    if (currentStatus === "withdrawn") {
      return res.status(200).json({
        success: true,
        message: "Lamaran sudah ditarik sebelumnya",
        data: application,
      });
    }

    //non-withdrawn/applied
    const forbiddenStatuses = ["reviewed", "accepted", "rejected"];
    if (forbiddenStatuses.includes(currentStatus)) {
      return res.status(400).json({
        success: false,
        message:
          "Lamaran dengan status reviewed, accepted, atau rejected tidak dapat ditarik",
      });
    }

    // update status
    application.status = "withdrawn";
    await application.save();

    return res.status(200).json({
      success: true,
      message: "Lamaran berhasil ditarik",
      data: application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
