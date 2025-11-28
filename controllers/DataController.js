const { Op } = require("sequelize");
const { Industry } = require("../models");

exports.getIndustries = async (req, res) => {
  try {

    const industries = await Industry.findAll({
      order: [["name", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      count: industries.length,
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
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSkills = async (req, res) => {
  try {
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
