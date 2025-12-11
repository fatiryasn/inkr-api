const {
  Job,
  JobSkill,
  JobDisability,
  Company,
  Disability,
  Skill,
  UserSkill,
  UserDisability,
  JobApplication,
  User,
  Industry,
} = require("../models");
const sequelize = require("../configs/database");
const { Op, literal, fn, col, where } = require("sequelize");
const moment = require("moment");

const ALLOWED_LIMITS = [30, 50, 80];
const ALLOWED_DISABILITY_TYPES = [
  "sensory",
  "intellectual",
  "mental",
  "physical",
  "multiple",
  "other",
];
const ALLOWED_EMPLOYMENT_TYPES = [
  "full-time",
  "part-time",
  "internship",
  "blank",
];

/*
  JOB CREATION CONTROLS
*/
//add new job
exports.addJob = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const user = req.dbUser;

    const company = await Company.findOne({
      where: { userId: user.id },
      transaction: t,
    });

    if (!company) {
      await t.rollback();
      return res.status(403).json({ message: "Company data not found" });
    }

    const skills = req.body.skills;
    const disabilities = req.body.disabilities;

    if (skills !== undefined && !Array.isArray(skills)) {
      await t.rollback();
      return res.status(400).json({ message: "skills must be an array" });
    }
    if (disabilities !== undefined && !Array.isArray(disabilities)) {
      await t.rollback();
      return res.status(400).json({ message: "disabilities must be an array" });
    }

    const today = moment().startOf("day");
    const start = moment(req.body.startDate, "YYYY-MM-DD");

    let autoStatus = "pending";
    if (start.isSame(today, "day")) {
      autoStatus = "open";
    }

    const jobPayload = {
      companyId: company.id,
      title: req.body.title,
      description: req.body.description,
      employmentType: req.body.employmentType,
      locationType: req.body.locationType,
      address: req.body.address ?? null,
      minSalary: req.body.minSalary ? Number(req.body.minSalary) : null,
      maxSalary: req.body.maxSalary ? Number(req.body.maxSalary) : null,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      status: autoStatus,
    };

    const job = await Job.create(jobPayload, { transaction: t });

    // -------------------
    // SKILLS
    // -------------------
    const createdSkills = [];
    if (Array.isArray(skills) && skills.length) {
      const ids = skills
        .filter((s) => s.id && Number.isInteger(s.id))
        .map((s) => s.id);

      const skillMap = {};
      if (ids.length) {
        const skillRows = await Skill.findAll({
          where: { id: { [Op.in]: ids } },
          transaction: t,
        });
        const foundIds = new Set(skillRows.map((r) => r.id));
        const missing = ids.filter((i) => !foundIds.has(i));
        if (missing.length) {
          await t.rollback();
          return res
            .status(400)
            .json({ message: `Skill id not found: ${missing.join(", ")}` });
        }
        skillRows.forEach((r) => (skillMap[r.id] = r.name));
      }

      for (const s of skills) {
        let skillId = null;
        let skillName = "";

        if (s.id && Number.isInteger(s.id)) {
          skillId = s.id;
          skillName = skillMap[s.id] ?? "";
        } else {
          const rawName = s.name;
          const cleanName = String(rawName).trim().toLowerCase();

          const [skill] = await Skill.findOrCreate({
            where: { name: cleanName },
            defaults: { name: cleanName },
            transaction: t,
          });

          skillId = skill.id;
          skillName = skill.name;
        }

        const jobSkill = await JobSkill.create(
          {
            jobId: job.id,
            skillId,
            skillName,
          },
          { transaction: t }
        );

        createdSkills.push(jobSkill);
      }
    }

    // -------------------
    // DISABILITIES (fixed, safer)
    // -------------------
    const createdDisabilities = [];
    if (Array.isArray(disabilities) && disabilities.length) {
      // parse ids defensif: ignore "", null, undefined, non-positive integers
      const ids = disabilities
        .map((d) => {
          if (d === null || d === undefined) return null;
          // treat empty string as no id
          if (d.id === "" || d.id === null || d.id === undefined) return null;
          const parsed = Number(d.id);
          return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
        })
        .filter((v) => v !== null);

      const disMap = {};
      if (ids.length) {
        const disRows = await Disability.findAll({
          where: { id: { [Op.in]: ids } },
          transaction: t,
        });

        const foundIds = new Set(disRows.map((r) => r.id));
        const missing = ids.filter((i) => !foundIds.has(i));
        if (missing.length) {
          await t.rollback();
          return res.status(400).json({
            message: `Disability id not found: ${missing.join(", ")}`,
          });
        }

        disRows.forEach((r) => {
          disMap[r.id] = {
            name: r.name,
            type: r.type ?? null,
          };
        });
      }

      const allowedTypes = [
        "sensory",
        "intellectual",
        "mental",
        "physical",
        "multiple",
        "other",
      ];

      for (const d of disabilities) {
        let disabilityId = null;
        let disabilityName = "";
        let disabilityType = "other";

        const rawId = d && d.id;
        const parsedId =
          rawId === "" || rawId === null || rawId === undefined
            ? null
            : Number(rawId);
        const hasId = Number.isInteger(parsedId) && parsedId > 0;

        if (hasId) {
          // jika id diberikan, pastikan memang ada di DB (disMap)
          if (!disMap[parsedId]) {
            await t.rollback();
            return res
              .status(400)
              .json({ message: `Disability id not found: ${parsedId}` });
          }
          disabilityId = parsedId;
          disabilityName = disMap[parsedId].name;
          disabilityType = disMap[parsedId].type ?? "other";
          if (!allowedTypes.includes(disabilityType)) disabilityType = "other";
        } else {
          // no valid id -> create/lookup by name + type
          const rawName = d && d.name ? d.name : "";
          const rawType = d && d.type ? d.type : "";
          const cleanName = String(rawName).trim().toLowerCase();
          let cleanType = String(rawType).trim().toLowerCase();
          if (!allowedTypes.includes(cleanType)) cleanType = "other";

          // findOrCreate berdasarkan kolom yang benar (model punya 'type')
          const [dis] = await Disability.findOrCreate({
            where: { name: cleanName, type: cleanType },
            defaults: { name: cleanName, type: cleanType },
            transaction: t,
          });

          disabilityId = dis.id;
          disabilityName = dis.name;
          disabilityType = dis.type ?? cleanType ?? "other";
          if (!allowedTypes.includes(disabilityType)) disabilityType = "other";
        }

        const jobDis = await JobDisability.create(
          {
            jobId: job.id,
            disabilityId,
            disabilityName,
            type: disabilityType,
          },
          { transaction: t }
        );

        createdDisabilities.push(jobDis);
      }
    }

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Job successfully created",
      data: {
        ...job.dataValues,
        skills: createdSkills,
        disabilities: createdDisabilities,
      },
    });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ success: false, message: err.message });
  }
};
//add job skill
exports.addJobSkill = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const jobId = req.job?.id;
    if (!jobId) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Job not found or unauthorized",
      });
    }

    const { skillId, skillName } = req.body;

    let finalSkillId = null;
    let finalSkillName = null;

    //given skillId
    if (skillId) {
      const skill = await Skill.findByPk(skillId, { transaction: t });
      if (!skill) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Skill ID not found",
        });
      }

      finalSkillId = skill.id;
      finalSkillName = skill.name;
    }

    //given skillName
    if (!skillId && skillName) {
      let skill = await Skill.findOne({
        where: { name: skillName.trim().toLowerCase() },
        transaction: t,
      });

      if (!skill) {
        skill = await Skill.create(
          { name: skillName.trim().toLowerCase() },
          { transaction: t }
        );
      }

      finalSkillId = skill.id;
      finalSkillName = skill.name;
    }

    if (!finalSkillName) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid skill name",
      });
    }

    const totalSkills = await JobSkill.count({
      where: { jobId },
      transaction: t,
    });

    if (totalSkills >= 20) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Maximum skill limit reached (20 per job)",
      });
    }

    const existing = await JobSkill.findOne({
      where: {
        jobId,
        [Op.or]: [
          finalSkillId ? { skillId: finalSkillId } : null,
          { skillName: finalSkillName },
        ].filter(Boolean),
      },
      transaction: t,
    });

    if (existing) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Skill is already added",
      });
    }

    //create job skill
    const newJobSkill = await JobSkill.create(
      {
        jobId,
        skillId: finalSkillId || null,
        skillName: finalSkillName,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "New job skill added successfully",
      data: newJobSkill,
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ success: false, message: error.message });
  }
};
//add job disability
exports.addJobDisability = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const jobId = req.job?.id;
    if (!jobId) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Job not found or unauthorized",
      });
    }

    const { disabilityId, disabilityName, type } = req.body;

    let finalDisabilityId = null;
    let finalDisabilityName = null;
    let finalDisabilityType = null;

    //given disabilityId
    if (disabilityId) {
      const dis = await Disability.findByPk(disabilityId, { transaction: t });
      if (!dis) {
        await t.rollback();
        return res
          .status(400)
          .json({ success: false, message: "Disability ID not found" });
      }
      finalDisabilityId = dis.id;
      finalDisabilityName = dis.name;
      finalDisabilityType = dis.type;
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
            message: "Required fields are still incomplete",
          });
        }

        dis = await Disability.create(
          { name: disabilityName, type, description: null },
          { transaction: t }
        );
      }

      finalDisabilityId = dis.id;
      finalDisabilityName = dis.name;
      finalDisabilityType = dis.type;
    }

    if (!finalDisabilityName || !finalDisabilityType) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Nama/Tipe disabilitas tidak valid" });
    }

    const totalDisabilities = await JobDisability.count({
      where: { jobId },
      transaction: t,
    });

    if (totalDisabilities >= 20) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Maximum disability limit reached (20 per job)",
      });
    }


    const existing = await JobDisability.findOne({
      where: {
        jobId,
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
        message: "Disability is already added",
      });
    }

    //create job disability
    const newJobDisability = await JobDisability.create(
      {
        jobId,
        disabilityId: finalDisabilityId || null,
        disabilityName: finalDisabilityName,
        type: finalDisabilityType,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "New job disability added successfully",
      data: newJobDisability,
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ success: false, message: error.message });
  }
};
//delete job skill
exports.deleteJobSkill = async (req, res) => {
  try {
    const detailId = req.params.id;
    const jobId = req.params.jobId;

    const existing = await JobSkill.findOne({
      where: { id: detailId, jobId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Job skill not found",
      });
    }

    await existing.destroy();

    return res.status(200).json({
      success: true,
      message: "Job skill removed successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
//delete job disabilities
exports.deleteJobDisability = async (req, res) => {
  try {
    const detailId = req.params.id;
    const jobId = req.params.jobId;

    const existing = await JobDisability.findOne({
      where: { id: detailId, jobId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Job disability not found",
      });
    }

    await existing.destroy();

    return res.status(200).json({
      success: true,
      message: "Job disability removed successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
//edit job
exports.editJob = async (req, res) => {
  try {
    const job = req.job;
    if (!job) {
      return res
        .status(404)
        .json({ success: false, message: "Job tidak ditemukan" });
    }

    const allowedFields = [
      "title",
      "description",
      "employmentType",
      "locationType",
      "address",
      "minSalary",
      "maxSalary",
    ];

    const updatedData = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updatedData[field] = req.body[field];
      }
    }

    await job.update(updatedData);

    return res.status(200).json({
      success: true,
      message: "Job berhasil diupdate",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

/*
  JOB VISUALIZATION
*/
//get jobs
exports.getJobs = async (req, res) => {
  try {
    //queries
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limitRequested = parseInt(
      req.query.limit || String(ALLOWED_LIMITS[0]),
      10
    );
    const limit = ALLOWED_LIMITS.includes(limitRequested)
      ? limitRequested
      : ALLOWED_LIMITS[0];
    const offset = (page - 1) * limit;

    const search = req.query.search ? String(req.query.search).trim() : null;
    const country = req.query.country ? String(req.query.country).trim() : null;

    //employmentTypes
    let employmentTypesParam = req.query.employmentTypes
      ? String(req.query.employmentTypes).trim()
      : null;
    let employmentTypes = null;
    if (employmentTypesParam) {
      employmentTypes = employmentTypesParam
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      const invalidEmp = employmentTypes.filter(
        (v) => !ALLOWED_EMPLOYMENT_TYPES.includes(v)
      );
      if (invalidEmp.length) {
        return res.status(400).json({
          success: false,
          message: `Invalid employmentType values: ${invalidEmp.join(", ")}`,
        });
      }
    }

    //disabilityTypes
    let disabilityTypesParam = req.query.disabilityTypes
      ? String(req.query.disabilityTypes).trim()
      : null;
    let disabilityTypes = null;
    if (disabilityTypesParam) {
      disabilityTypes = disabilityTypesParam
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      const invalidDis = disabilityTypes.filter(
        (v) => !ALLOWED_DISABILITY_TYPES.includes(v)
      );
      if (invalidDis.length) {
        return res.status(400).json({
          success: false,
          message: `Invalid disabilityTypes values: ${invalidDis.join(", ")}`,
        });
      }
    }

    //personalized
    const personalized =
      String(req.query.personalized || "false").toLowerCase() === "true";
    //sort
    const sort = req.query.sort === "most_popular" ? "most_popular" : "newest";

    //job where clause
    const jobWhere = { status: "open" };

    if (search) {
      jobWhere[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }
    if (employmentTypes && employmentTypes.length) {
      jobWhere.employmentType = { [Op.in]: employmentTypes };
    }

    //company where clause
    const companyWhere = {};
    if (search) companyWhere.companyName = { [Op.like]: `%${search}%` };
    if (country) companyWhere.country = country;

    const companyInclude = {
      model: Company,
      required: Object.keys(companyWhere).length > 0,
      where: Object.keys(companyWhere).length > 0 ? companyWhere : undefined,
      attributes: ["id", "companyName", "country", "city"],
    };
    const skillInclude = {
      model: JobSkill,
      attributes: ["skillId", "skillName"],
    };
    const disabilityInclude = {
      model: JobDisability,
      attributes: ["disabilityId", "disabilityName"],
    };
    if (disabilityTypes) {
      disabilityInclude.include = [
        {
          model: Disability,
          attributes: ["id", "name", "type"],
          where: { type: { [Op.in]: disabilityTypes } },
        },
      ];
    }

    // if (disabilityTypes && disabilityTypes.length) {
    //   disabilityInclude.required = true;
    //   disabilityInclude.include = [
    //     {
    //       model: Disability,
    //       required: true,
    //       attributes: ["id", "name", "type"],
    //     },
    //   ];
    // }

    // --- collect user skill/disability ids if personalized requested ---
    let userSkillIds = [];
    let userDisabilityIds = [];
    if (personalized && req.user && req.user.id) {
      const userId = req.user.id;
      const usrSkills = await UserSkill.findAll({
        where: { userId },
        attributes: ["skillId"],
      });
      const usrDis = await UserDisability.findAll({
        where: { userId },
        attributes: ["disabilityId"],
      });
      userSkillIds = usrSkills.map((r) => r.skillId);
      userDisabilityIds = usrDis.map((r) => r.disabilityId);
    }

    // --- total count for pagination meta ---
    // include company and disabilityInclude so count respects filters
    const countIncludes = [companyInclude];
    if (disabilityInclude.required) countIncludes.push(disabilityInclude);

    const total = await Job.count({
      where: jobWhere,
      include: countIncludes,
      distinct: true,
    });
    const totalPages = Math.ceil(total / limit);

    // --- build ordering ---
    let order = [["createdAt", "DESC"]];
    if (sort === "most_popular") {
      const appsCountLiteral = literal(
        `(SELECT COUNT(*) FROM job_applications WHERE job_applications.jobId = jobs.id)`
      );
      order = [
        [appsCountLiteral, "DESC"],
        ["createdAt", "DESC"],
      ];
    }

    // --- fetch jobs for this page ---
    const includes = [companyInclude, skillInclude, disabilityInclude];

    const jobs = await Job.findAll({
      where: jobWhere,
      include: includes,
      limit,
      offset,
      order,
      distinct: true,
      logging: console.log,
    });

    // if not personalized or user not provided -> return plain jobs
    if (!personalized || !req.user || !req.user.id) {
      return res.json({
        success: true,
        meta: { page, limit, total, totalPages },
        data: jobs,
      });
    }

    // --- personalized scoring for current page only ---
    const scored = jobs.map((job) => {
      const jobJSON = job.toJSON ? job.toJSON() : job;
      const skillMatches = (jobJSON.skills || []).filter((s) =>
        userSkillIds.includes(s.skillId)
      ).length;
      const disabilityMatches = (jobJSON.disabilities || []).filter((d) =>
        userDisabilityIds.includes(d.disabilityId)
      ).length;
      const score = skillMatches * 2 + disabilityMatches * 1;
      return { ...jobJSON, score, skillMatches, disabilityMatches };
    });

    // reorder the page by score desc then createdAt desc
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return res.json({
      success: true,
      meta: { page, limit, total, totalPages },
      data: scored,
    });
  } catch (err) {
    console.error("getJobs error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
// GET /job/:jobId
exports.getJobById = async (req, res) => {
  try {
    const rawId = req.params.jobId;
    const jobId = Number(rawId);

    if (!rawId || Number.isNaN(jobId) || jobId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "jobId tidak valid" });
    }

    const job = await Job.findOne({
      where: { id: jobId },
      include: [
        {
          model: Company,
          attributes: [
            "id",
            "companyName",
            "country",
            "city",
            "websiteLink",
            "establishedYear",
            "industryId",
            "industryName",
          ],
          required: false,
          include: [
            {
              model: User,
              attributes: ["id", "username", "profilePicture"],
            },
            {
              model: Industry,
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    });

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // Count applications for the job
    const applicationsCount = await JobApplication.count({ where: { jobId } });

    let applied = false;
    if (req.user && req.user.id) {
      const existing = await JobApplication.findOne({
        where: { jobId, userId: req.user.id },
        attributes: ["id"],
      });
      applied = !!existing;
    }

    const jobJSON = job.toJSON ? job.toJSON() : job;
    return res.json({
      success: true,
      data: {
        ...jobJSON,
        applicationsCount,
        applied,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
// GET /job/:jobId/skills
exports.getJobSkills = async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId, 10);
    if (!jobId || Number.isNaN(jobId) || jobId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid jobId" });
    }

    // verify job exists (optional but nice)
    const jobExists = await Job.findByPk(jobId, { attributes: ["id"] });
    if (!jobExists) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const skills = await JobSkill.findAll({
      where: { jobId },
      attributes: ["id", "skillId", "skillName"],
      include: [
        {
          model: Skill,
          attributes: ["id", "name"],
          required: false,
        },
      ],
    });

    return res.json({ success: true, data: skills });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /job/:jobId/disabilities
exports.getJobDisabilities = async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId, 10);
    if (!jobId || Number.isNaN(jobId) || jobId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid jobId" });
    }

    // verify job exists
    const jobExists = await Job.findByPk(jobId, { attributes: ["id"] });
    if (!jobExists) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const disabilities = await JobDisability.findAll({
      where: { jobId },
      attributes: ["id", "disabilityId", "disabilityName"],
      include: [
        {
          model: Disability,
          attributes: ["id", "name", "type"],
          required: false,
        },
      ],
    });

    return res.json({ success: true, data: disabilities });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/*
  JOB APPLICATION CONTROLS
*/
//get job applications
exports.getJobApplications = async (req, res) => {
  try {
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
//apply job
exports.applyJob = async (req, res) => {
  try {
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
//reschedule job
exports.rescheduleJob = async (req, res) => {
  try {
    const job = req.job;
    if (!job) {
      return res
        .status(404)
        .json({ success: false, message: "Job tidak ditemukan" });
    }

    const currentStatus = String(job.status || "").toLowerCase();
    const { startDate, endDate } = req.body;

    const mStart = moment(startDate, "YYYY-MM-DD");
    const mEnd = moment(endDate, "YYYY-MM-DD");
    const mStartJob = moment(job.startDate, "YYYY-MM-DD");

    const today = moment().startOf("day");
    const tomorrow = moment().add(1, "day").startOf("day");

    //closed / cancelled
    if (currentStatus === "closed" || currentStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: `Lowongan dengan status '${currentStatus}' tidak dapat di-reschedule.`,
      });
    }

    //pending
    if (currentStatus === "pending") {
      if (!startDate && !endDate) {
        return res.status(400).json({
          success: false,
          message: "Field yang dibutuhkan masih belum lengkap",
        });
      }

      if (mStart.isBefore(today, "day")) {
        return res.status(400).json({
          success: false,
          message: "Tanggal awal harus hari ini atau setelahnya.",
        });
      }
      if (!mEnd.isAfter(mStart, "day")) {
        return res.status(400).json({
          success: false,
          message: "Tanggal akhir harus setelah tanggal awal.",
        });
      }

      const unchanged =
        moment(job.startDate).isSame(mStart, "day") &&
        moment(job.endDate).isSame(mEnd, "day");

      if (unchanged) {
        return res.status(400).json({
          success: false,
          message:
            "Tidak ada perubahan tanggal (nilai sama dengan sebelumnya).",
          data: job,
        });
      }

      job.startDate = mStart.format("YYYY-MM-DD");
      job.endDate = mEnd.format("YYYY-MM-DD");

      await job.save();

      return res.status(200).json({
        success: true,
        message: "Tanggal lowongan berhasil diperbarui.",
        data: job,
      });
    }

    //open
    if (currentStatus === "open") {
      if (!endDate) {
        return res.status(400).json({
          success: false,
          message: "Field yang dibutuhkan masih belum lengkap",
        });
      }

      if (mEnd.isBefore(tomorrow, "day")) {
        return res.status(400).json({
          success: false,
          message: "Tanggal akhir minimal harus besok atau setelahnya.",
        });
      }
      if (!mEnd.isAfter(mStartJob, "day")) {
        return res.status(400).json({
          success: false,
          message: "Tanggal akhir harus setelah tanggal awal.",
        });
      }
      if (moment(job.endDate).isSame(mEnd, "day")) {
        return res.status(400).json({
          success: false,
          message:
            "Tidak ada perubahan tanggal (nilai sama dengan sebelumnya).",
          data: job,
        });
      }

      job.endDate = mEnd.format("YYYY-MM-DD");
      await job.save();

      return res.status(200).json({
        success: true,
        message: "Tanggal lowongan berhasil diperbarui.",
        data: job,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Aksi reschedule tidak diizinkan untuk status saat ini.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
//update job status
exports.updateJobStatus = async (req, res) => {
  try {
    const job = req.job;
    if (!job) {
      return res
        .status(404)
        .json({ success: false, message: "Job tidak ditemukan" });
    }

    const currentStatus = String(job.status || "").toLowerCase();
    const { status: requestedStatusRaw, endDate: requestedEndDate } = req.body;
    const requestedStatus = String(requestedStatusRaw || "").toLowerCase();

    if (!requestedStatus) {
      return res
        .status(400)
        .json({ success: false, message: "Status target harus diberikan" });
    }

    if (requestedStatus === currentStatus) {
      return res.status(200).json({
        success: true,
        message: "Tidak ada perubahan status (status sama dengan sebelumnya)",
        data: job,
      });
    }

    if (currentStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Lowongan yang telah dibatalkan tidak dapat diubah statusnya.",
      });
    }

    // REQUEST: open
    if (requestedStatus === "open") {
      if (currentStatus === "pending") {
        job.status = "open";
      } else if (currentStatus === "closed") {
        if (!requestedEndDate) {
          return res.status(400).json({
            success: false,
            message:
              "Untuk re-open, silakan sertakan endDate (format YYYY-MM-DD).",
          });
        }

        const mEnd = moment(requestedEndDate, "YYYY-MM-DD", true);
        const mStart = moment(job.startDate, "YYYY-MM-DD", true);
        if (!mEnd.isAfter(mStart, "day")) {
          return res.status(400).json({
            success: false,
            message: "endDate harus setelah startDate lowongan.",
          });
        }

        job.endDate = mEnd.format("YYYY-MM-DD");
        job.status = "open";
      } else {
        return res.status(400).json({
          success: false,
          message: `Transisi dari status '${currentStatus}' ke 'open' tidak diizinkan.`,
        });
      }

      // REQUEST: cancelled
    } else if (requestedStatus === "cancelled") {
      if (currentStatus === "pending" || currentStatus === "open") {
        job.status = "cancelled";
        job.endDate = moment().format("YYYY-MM-DD");
      } else {
        return res.status(400).json({
          success: false,
          message: `Transisi dari status '${currentStatus}' ke 'cancelled' tidak diizinkan.`,
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Status target tidak valid atau tidak diizinkan.",
      });
    }

    await job.save();

    return res.status(200).json({
      success: true,
      message: "Status lowongan berhasil diperbarui.",
      data: job,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
