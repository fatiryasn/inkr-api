const { Op } = require("sequelize");
const sequelize = require("../configs/database");
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
} = require("../models");
const { deleteUserDetail } = require("../utils/deleteUserDetails");

// update job seeker profile
exports.jsProfileUpdate = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = req.dbUser;

    if (user.role !== "job-seeker") {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak",
      });
    }

    const profile = await UserProfile.findOne({ where: { userId } });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profil job-seeker tidak ditemukan",
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
      message: "Profil berhasil diupdate",
      data: profile,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    });

    const institutionIds = [
      ...new Set(rows.map((r) => r.institutionId).filter((id) => id)),
    ];

    let companiesById = {};
    let usersById = {};

    if (institutionIds.length > 0) {
      const companies = await Company.findAll({
        where: { id: institutionIds },
        attributes: ["id", "companyName", "userId"],
      });

      companiesById = companies.reduce((acc, c) => {
        acc[c.id] = c;
        return acc;
      }, {});

      const userIds = [
        ...new Set(companies.map((c) => c.userId).filter((id) => id)),
      ];

      if (userIds.length > 0) {
        const users = await User.findAll({
          where: { id: userIds },
          attributes: ["id", "username", "profilePicture"],
        });
        usersById = users.reduce((acc, u) => {
          acc[u.id] = u;
          return acc;
        }, {});
      }
    }

    const enriched = rows.map((r) => {
      const obj = r.toJSON ? r.toJSON() : { ...r };
      if (obj.institutionId && companiesById[obj.institutionId]) {
        const comp = companiesById[obj.institutionId];
        const compUser = usersById[comp.userId] || null;
        obj.institution = {
          id: comp.id,
          companyName: comp.companyName,
          user: compUser
            ? {
                id: compUser.id,
                username: compUser.username,
                profilePicture: compUser.profilePicture,
              }
            : null,
        };
      }
      return obj;
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      success: true,
      message: "Berhasil mendapatkan data pendidikan user",
      data: enriched,
      pagination: {
        totalData: count,
        currentPage: page,
        totalPages,
        pageSize: limit,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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
    });

    const companyIds = [
      ...new Set(rows.map((r) => r.companyId).filter((id) => id)),
    ];

    let companiesById = {};
    let usersById = {};

    if (companyIds.length > 0) {
      const companies = await Company.findAll({
        where: { id: companyIds },
        attributes: ["id", "companyName", "userId"],
      });

      companiesById = companies.reduce((acc, c) => {
        acc[c.id] = c;
        return acc;
      }, {});

      const userIds = [
        ...new Set(companies.map((c) => c.userId).filter((id) => id)),
      ];

      if (userIds.length > 0) {
        const users = await User.findAll({
          where: { id: userIds },
          attributes: ["id", "username", "profilePicture"],
        });
        usersById = users.reduce((acc, u) => {
          acc[u.id] = u;
          return acc;
        }, {});
      }
    }

    const enriched = rows.map((r) => {
      const obj = r.toJSON ? r.toJSON() : { ...r };
      if (obj.companyId && companiesById[obj.companyId]) {
        const comp = companiesById[obj.companyId];
        const compUser = usersById[comp.userId] || null;
        obj.company = {
          id: comp.id,
          companyName: comp.companyName,
          user: compUser
            ? {
                id: compUser.id,
                username: compUser.username,
                profilePicture: compUser.profilePicture,
              }
            : null,
        };
      }
      return obj;
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      success: true,
      message: "Berhasil mendapatkan data pengalaman user",
      data: enriched,
      pagination: {
        totalData: count,
        currentPage: page,
        totalPages,
        pageSize: limit,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      success: true,
      message: "Berhasil mendapatkan data skill user",
      data: rows,
      pagination: {
        totalData: count,
        currentPage: page,
        totalPages,
        pageSize: limit,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      success: true,
      message: "Berhasil mendapatkan data disabilitas user",
      data: rows,
      pagination: {
        totalData: count,
        currentPage: page,
        totalPages,
        pageSize: limit,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// add job seeker education
exports.addJsEducation = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

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
      message: "Pendidikan berhasil ditambahkan",
      data: newEducation,
    });
  } catch (error) {
    console.error("addJsEducation error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// add job seeker experience
exports.addJsExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

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
      message: "Pengalaman user berhasil ditambahkan",
      data: newExperience,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// add job seeker skill
exports.addJsSkill = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.dbUser?.id || req.user?.id;
    if (!userId) {
      await t.rollback();
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { skillId, skillName } = req.body;

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
        [Op.or]: [
          finalSkillId ? { skillId: finalSkillId } : null,
          { skillName: finalSkillName },
        ].filter(Boolean),
      },
      transaction: t,
    });

    if (existing) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Skill sudah ada di profil Anda" });
    }

    const newUserSkill = await UserSkill.create(
      {
        userId,
        skillId: finalSkillId || null,
        skillName: finalSkillName,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Skill user berhasil ditambahkan",
      data: newUserSkill,
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ success: false, message: error.message });
  }
};

// add job seeker disability
exports.addJsDisability = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.dbUser?.id || req.user?.id;
    if (!userId) {
      await t.rollback();
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { disabilityId, disabilityName, type } = req.body;

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

        dis = await Disability.create(
          { name: disabilityName, type, description: null },
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
        [Op.or]: [
          finalDisabilityId ? { disabilityId: finalDisabilityId } : null,
          { disabilityName: finalDisabilityName },
        ].filter(Boolean),
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

    const newUserDisability = await UserDisability.create(
      {
        userId,
        disabilityId: finalDisabilityId || null,
        disabilityName: finalDisabilityName,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Disabilitas user berhasil ditambahkan",
      data: newUserDisability,
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ success: false, message: error.message });
  }
};

//delete job seeker education
exports.deleteJsEducation = async (req, res) => {
  try {
    const detailId = req.params.detailId;
    await deleteUserDetail(UserEducation, detailId, req.user.id);

    res.status(200).json({
      success: true,
      message: "Education user berhasil dihapus",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
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
      message: "Experience user berhasil dihapus",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
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
      message: "Skill user berhasil dihapus",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
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
      message: "Disabilitas user berhasil dihapus",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};
