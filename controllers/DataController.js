const { Op } = require("sequelize");
const { Industry, Disability, Skill } = require("../models");

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
      limit: 30
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
