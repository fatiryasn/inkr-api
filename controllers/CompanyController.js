const { Company } = require("../models");

// update company profile
exports.cmProfileUpdate = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = req.dbUser;

    if (user.role !== "company") {
      return res.status(403).json({
        success: false,
        message: "User bukan perusahaan",
      });
    }

    let company = await Company.findOne({ where: { userId } });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Data perusahaan tidak ditemukan",
      });
    }

    // Fields yang bisa diupdate
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

    const updatedData = {};

    if (companyName !== undefined) updatedData.companyName = companyName;
    if (companyDescription !== undefined)
      updatedData.companyDescription = companyDescription;
    if (country !== undefined) updatedData.country = country;
    if (city !== undefined) updatedData.city = city;
    if (address !== undefined) updatedData.address = address;
    if (establishedYear !== undefined)
      updatedData.establishedYear = establishedYear;
    if (industryId !== undefined) updatedData.industryId = industryId;
    if (industryName !== undefined) updatedData.industryName = industryName;
    if (websiteLink !== undefined) updatedData.websiteLink = websiteLink;

    //update
    await company.update(updatedData);

    return res.status(200).json({
      success: true,
      message: "Profil perusahaan berhasil diperbarui",
      data: company,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
