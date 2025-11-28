const {
  Job,
  JobSkill,
  JobDisability,
  Company,
  Disability,
  Skill,
} = require("../models");
const sequelize = require("../configs/database");
const { Op } = require("sequelize");
const moment = require("moment");

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
    // DISABILITIES
    // -------------------
    const createdDisabilities = [];
    if (Array.isArray(disabilities) && disabilities.length) {
      const ids = disabilities
        .filter((d) => d.id && Number.isInteger(d.id))
        .map((d) => d.id);

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
            disabilityType: r.disabilityType ?? null,
          };
        });
      }

      for (const d of disabilities) {
        let disabilityId = null;
        let disabilityName = "";

        if (d.id && Number.isInteger(d.id)) {
          disabilityId = d.id;
          disabilityName = disMap[d.id].name;
        } else {
          const rawName = d.name;
          const rawType = d.type;
          const cleanName = String(rawName).trim().toLowerCase();
          const cleanType = String(rawType).trim().toLowerCase();

          const [dis] = await Disability.findOrCreate({
            where: { name: cleanName, disabilityType: cleanType },
            defaults: { name: cleanName, disabilityType: cleanType },
            transaction: t,
          });

          disabilityId = dis.id;
          disabilityName = dis.name;
        }

        const jobDis = await JobDisability.create(
          {
            jobId: job.id,
            disabilityId,
            disabilityName,
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
    }

    if (!finalDisabilityName) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Nama disabilitas tidak valid" });
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

//get job by id
exports.getJobById = async (req, res) => {
  try {
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
//get job skills
exports.getJobSkills = async (req, res) => {
  try {
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
//get job disabilities
exports.getJobDisabilities = async (req, res) => {
  try {
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
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

//edit job
exports.editJob = (req, res) => {
  try {
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//update job status
exports.updateJobStatus = (req, res) => {
  try {
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
