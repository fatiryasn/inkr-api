const {
  User,
  UserProfile,
  Company,
  Industry,
  RegisterRequest,
  UserSuspend,
} = require("../models");
const fs = require("fs");
const moment = require("moment");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const sequelize = require("../config/database");
const cloudinary = require("../utils/cloudinary");
const {
  extractCloudinaryPublicId,
} = require("../utils/extractCloudinaryPublicId");
const {
  sendRegistrationDecisionEmail,
} = require("../utils/sendRegistrationDecisionEmail");

/*
  COMMON USERS
*/
//get users
exports.getUsers = async (req, res) => {
  try {
    //queries
    let { search, page = "1", limit = "30", country, role, status } = req.query;

    page = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.min(
      [30, 50, 80].includes(parseInt(limit, 10)) ? parseInt(limit, 10) : 30,
      80
    );
    const offset = (page - 1) * limit;

    const allowedRoles = ["job-seeker", "company"];
    if (!allowedRoles.includes(role)) role = null;

    const allowedStatus = [
      "pending",
      "requested",
      "rejected",
      "active",
      "suspended",
      "suspended-temp",
    ];
    if (!allowedStatus.includes(status)) status = null;

    //where clause
    const userWhere = {
      role: { [Op.notIn]: ["admin", "super-admin"] },
    };

    if (role) userWhere.role = role;
    if (status) userWhere.accountStatus = status;

    //search
    if (search) {
      const q = search.trim().toLowerCase();

      const orConditions = [
        { username: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
      ];

      //js search
      if (role === "job-seeker" || !role) {
        orConditions.push({
          [Op.and]: [
            { role: "job-seeker" },
            sequelize.literal(`EXISTS (
              SELECT 1 FROM user_profiles 
              WHERE user_profiles.userId = User.id 
              AND LOWER(user_profiles.fullName) LIKE '%${q}%'
            )`),
          ],
        });
      }

      //cm search
      if (role === "company" || !role) {
        orConditions.push({
          [Op.and]: [
            { role: "company" },
            sequelize.literal(`EXISTS (
              SELECT 1 FROM companies 
              WHERE companies.userId = User.id 
              AND LOWER(companies.companyName) LIKE '%${q}%'
            )`),
          ],
        });
      }

      userWhere[Op.or] = orConditions;
    }

    //country
    if (country) {
      const countryLower = country.trim().toLowerCase();
      const countryConditions = [
        sequelize.literal(`EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE user_profiles.userId = User.id 
          AND LOWER(user_profiles.country) = '${countryLower}'
        )`),
        sequelize.literal(`EXISTS (
          SELECT 1 FROM companies 
          WHERE companies.userId = User.id 
          AND LOWER(companies.country) = '${countryLower}'
        )`),
      ];

      userWhere[Op.or] = userWhere[Op.or]
        ? [...userWhere[Op.or], ...countryConditions]
        : { [Op.or]: countryConditions };
    }

    //includes
    const include = [
      {
        model: RegisterRequest,
        attributes: ["registerCode", "updatedAt"],
        required: false,
      },
      {
        model: UserProfile,
        attributes: ["fullName", "country", "city", "gender"],
        required: false,
      },
      {
        model: Company,
        attributes: ["companyName", "country", "city"],
        required: false,
      },
    ];

    // query
    const { rows, count } = await User.findAndCountAll({
      attributes: [
        "id",
        "username",
        "email",
        "role",
        "authProvider",
        "profilePicture",
        "accountStatus",
        "createdAt",
      ],
      where: userWhere,
      include,
      order: [["updatedAt", "DESC"]],
      limit,
      offset,
      distinct: true,
      subQuery: false,
    });

    const totalPages = Math.ceil(count / limit);

    return res.json({
      success: true,
      data: rows,
      meta: {
        total: count,
        page,
        limit,
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
//get user by id
exports.getUserById = async (req, res) => {
  try {
    const rawId = req.params.userId;
    const userId = Number(rawId);

    if (!rawId || Number.isNaN(userId) || userId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "ID user invalid" });
    }

    const requestingUser = req.user;

    //exclude fields
    let excludeAttributes = ["password", "refreshToken", "gaSecret"];

    //non-admin exclude fields
    if (
      !requestingUser ||
      !["admin", "super-admin"].includes(requestingUser.role)
    ) {
      excludeAttributes = excludeAttributes.concat(["accountStatus", "email"]);
    }

    const targetUserRoleCheck = await User.findOne({
      where: { id: userId },
      attributes: ["role", "accountStatus"],
    });
    if (!targetUserRoleCheck) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const targetUserRole = targetUserRoleCheck.role;
    const targetAccountStatus = targetUserRoleCheck.accountStatus;

    //non-admin cant see admin profiles
    if (targetUserRole === "admin" || targetUserRole === "super-admin") {
      if (
        !requestingUser ||
        !["admin", "super-admin"].includes(requestingUser.role)
      ) {
        return res.status(404).json({
          success: false,
          message: "User tidak ditemukan",
        });
      }

      if (requestingUser.role === "admin" && requestingUser.id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Akses ditolak. Admin tidak dapat melihat profil admin lain",
        });
      }
    }

    //non-admin cant see in-active profiles
    if (targetAccountStatus !== "active") {
      if (
        !requestingUser ||
        !["admin", "super-admin"].includes(requestingUser.role)
      ) {
        return res.status(404).json({
          success: false,
          message: "User tidak ditemukan",
        });
      }
    }

    //includes
    let includes = [];

    includes.push({
      model: UserProfile,
      required: false,
    });

    includes.push({
      model: Company,
      required: false,
      include: [
        {
          model: Industry,
          required: false,
        },
      ],
    });

    //admin-only additional data
    if (
      requestingUser &&
      ["admin", "super-admin"].includes(requestingUser.role)
    ) {
      includes.push({
        model: UserSuspend,
        as: "UserSuspends",
        attributes: [
          "id",
          "suspendCode",
          "type",
          "suspendedAt",
          "suspendUntil",
          "unsuspendedAt",
          "createdAt",
        ],
        required: false,
      });

      includes.push({
        model: RegisterRequest,
        required: false,
      });
    }

    //find
    const user = await User.findByPk(userId, {
      attributes: {
        exclude: excludeAttributes,
      },
      include: includes,
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    //required profile based on role
    if (
      (user.role === "job-seeker" ||
        user.role === "admin" ||
        user.role === "super-admin") &&
      !user.UserProfile
    ) {
      return res.status(404).json({
        success: false,
        message: "Profil user tidak ditemukan",
      });
    }

    if (user.role === "company" && !user.Company) {
      return res.status(404).json({
        success: false,
        message: "Profil perusahaan tidak ditemukan",
      });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: error.message || "Internal server error",
      });
  }
};
//update username
exports.updateUsername = async (req, res) => {
  try {
    const { username } = req.body;
    const user = req.dbUser;

    const existing = await User.findOne({
      where: { username },
    });

    if (existing && existing.id === user.id) {
      return res.status(400).json({
        success: true,
        message: "Tidak ada perubahan yang dilakukan",
      });
    }

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Username sudah digunakan pengguna lain",
      });
    }

    user.username = username;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Username pengguna berhasil diperbarui",
      data: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
//update profile picture
exports.updateProfilePicture = async (req, res) => {
  try {
    const user = req.dbUser;

    //no file given
    if (!req.file) {
      if (!user.profilePicture) {
        return res.status(204).send();
      }

      const oldPublicId = extractCloudinaryPublicId(user.profilePicture);
      if (oldPublicId) {
        try {
          await cloudinary.uploader.destroy(oldPublicId);
        } catch (err) {
          console.error("Gagal hapus gambar lama di Cloudinary:", err);
        }
      }

      user.profilePicture = null;
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Foto profil pengguna berhasil dihapus",
      });
    }

    if (!req.file.path) {
      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server: file path tidak tersedia",
      });
    }

    //file given
    if (user.profilePicture) {
      const oldPublicId = extractCloudinaryPublicId(user.profilePicture);
      if (oldPublicId) {
        try {
          await cloudinary.uploader.destroy(oldPublicId);
        } catch (err) {
          console.error("Gagal hapus gambar lama di Cloudinary:", err);
        }
      }
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "inkr-pfp",
    });

    user.profilePicture = result.secure_url;
    await user.save();

    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Gagal hapus file lokal:", err);
    });

    return res.status(200).json({
      success: true,
      message: "Foto profil pengguna berhasil diperbarui",
      data: { profilePicture: user.profilePicture },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/*
  ADMIN
*/
//get admins (super-admin)
exports.getAdmins = async (req, res) => {
  try {
    //queries
    let { search, page = "1", limit = "30", role, status } = req.query;

    page = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.min(
      [30, 50, 80].includes(parseInt(limit, 10)) ? parseInt(limit, 10) : 30,
      80
    );
    const offset = (page - 1) * limit;

    const allowedStatus = [
      "pending",
      "requested",
      "rejected",
      "active",
      "suspended",
      "suspended-temp",
    ];
    if (!allowedStatus.includes(status)) status = null;

    //where clause
    const userWhere = {
      role: { [Op.or]: ["admin", "super-admin"] },
    };

    if (role) {
      userWhere.role = ["admin", "super-admin"].includes(role)
        ? role
        : { [Op.or]: ["admin", "super-admin"] };
    }

    if (status) userWhere.accountStatus = status;

    //search
    if (search) {
      const q = search.trim().toLowerCase();

      const orConditions = [
        { username: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
      ];

      orConditions.push({
        [Op.and]: [
          {
            [Op.or]: [{ role: "admin" }, { role: "super-admin" }],
          },
          sequelize.literal(`EXISTS (
              SELECT 1 FROM user_profiles 
              WHERE user_profiles.userId = User.id 
              AND LOWER(user_profiles.fullName) LIKE '%${q}%'
            )`),
        ],
      });

      userWhere[Op.and] = [
        { [Op.or]: ["admin", "super-admin"].map((role) => ({ role })) },
        { [Op.or]: orConditions },
      ];
    }

    //includes
    const include = [
      {
        model: UserProfile,
        attributes: ["fullName", "country", "city", "gender"],
        required: false,
      },
    ];

    //find
    const { rows, count } = await User.findAndCountAll({
      attributes: [
        "id",
        "username",
        "email",
        "role",
        "authProvider",
        "profilePicture",
        "accountStatus",
        "gaSecret",
        "createdAt",
      ],
      where: userWhere,
      include,
      order: [["updatedAt", "DESC"]],
      limit,
      offset,
      distinct: true,
      subQuery: false,
    });

    const transformedRows = rows.map((user) => ({
      ...user.toJSON(),
      hasGauth: !!user.gaSecret,
      gaSecret: undefined,
    }));

    const totalPages = Math.ceil(count / limit);

    return res.json({
      success: true,
      data: transformedRows,
      meta: {
        total: count,
        page,
        limit,
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
//create admin (super-admin)
exports.addNewAdmin = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { username, email, password, fullName, country, city, gender, role } =
      req.body;

    // conflict check
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
      transaction: t,
    });

    if (existingUser) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: "Username atau email sudah terdaftar.",
      });
    }

    // hashing password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create(
      {
        username,
        email,
        password: hashedPassword,
        role,
        authProvider: "local",
        accountStatus: "active",
      },
      { transaction: t }
    );

    await UserProfile.create(
      {
        userId: user.id,
        fullName,
        country,
        city,
        gender,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Akun baru berhasil dibuat",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};


/*
  USER SUSPENDS
*/
//get suspends
exports.getSuspends = async (req, res) => {
  try {
    const requestingUser = req.user;
    let { type, status, role, page = 1, limit = 30, search } = req.query;

    page = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.min(
      [30, 50, 80].includes(parseInt(limit, 10)) ? parseInt(limit, 10) : 30,
      80
    );
    const offset = (page - 1) * limit;

    const allowedRoles = ["job-seeker", "company"];
    if (!allowedRoles.includes(role)) role = null;

    const allowedType = ["temporary", "permanent"];
    if (!allowedType.includes(type)) type = null;

    const allowedStatus = ["active", "expired"];
    if (!allowedStatus.includes(status)) status = null;

    //where clause
    const where = {};

    if (type) {
      where.type = type;
    }
    if (status === "active") {
      where.unsuspendedAt = null;
    } else if (status === "expired") {
      where.unsuspendedAt = { [Op.not]: null };
    }

    //user where clase
    const userWhere = {};
    if (role) {
      userWhere.role = role;
    }

    //exclude admin/super-admin if role is not super-admin
    if (!requestingUser || requestingUser.role !== "super-admin") {
      userWhere.role = {
        [Op.notIn]: ["admin", "super-admin"],
      };
    }

    //search
    if (search) {
      const searchQuery = search.trim().toLowerCase();

      if (searchQuery.match(/^spd\d*$/i)) {
        where.suspendCode = { [Op.like]: `%${searchQuery}%` };
      } else {
        userWhere[Op.or] = [
          { username: { [Op.like]: `%${searchQuery}%` } },
          { email: { [Op.like]: `%${searchQuery}%` } },
        ];
      }
    }

    //includes
    const includes = [
      {
        model: User,
        as: "User",
        attributes: ["username", "email", "profilePicture", "role"],
        where: userWhere,
        required: true,
      },
      {
        model: User,
        as: "SuspendedBy",
        attributes: ["username", "profilePicture", "role"],
        required: false,
      },
      {
        model: User,
        as: "UnsuspendedBy",
        attributes: ["username", "profilePicture", "role"],
        required: false,
      },
    ];

    if (!requestingUser || requestingUser.role !== "super-admin") {
      includes[1].where = { role: { [Op.notIn]: ["admin", "super-admin"] } };
      includes[2].where = { role: { [Op.notIn]: ["admin", "super-admin"] } };
    }

    //find
    const { rows, count } = await UserSuspend.findAndCountAll({
      attributes: [
        "id",
        "suspendCode",
        "type",
        "suspendedAt",
        "suspendedBy",
        "suspendUntil",
        "unsuspendedAt",
        "unsuspendedBy",
      ],
      where,
      include: includes,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    const suspendsWithStatus = rows.map((suspend) => {
      const suspendData = suspend.toJSON();
      suspendData.status = suspendData.unsuspendedAt ? "expired" : "active";
      return suspendData;
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      success: true,
      data: suspendsWithStatus,
      meta: {
        total: count,
        page,
        limit,
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
//get suspend by SPD
exports.getSuspendBySPD = async (req, res) => {
  try {
    const requestingUser = req.user;
    const suspendCode = req.params.spdCode;

    if (!suspendCode) {
      return res.status(400).json({
        success: false,
        message: "Kode suspend tidak ada",
      });
    }

    const includeModels = [
      {
        model: User,
        as: "User",
        attributes: [
          "id",
          "username",
          "email",
          "role",
          "authProvider",
          "accountStatus",
          "createdAt",
        ],
        required: true,
        include: [
          {
            model: UserProfile,
            attributes: ["fullName", "country", "city", "gender"],
            required: false,
          },
          {
            model: Company,
            attributes: [
              "companyName",
              "country",
              "city",
              "industryId",
              "websiteLink",
            ],
            required: false,
            include: [
              {
                model: Industry,
              },
            ],
          },
        ],
      },
      {
        model: User,
        as: "SuspendedBy",
        attributes: ["id", "username", "email", "role", "profilePicture"],
        required: false,
      },
      {
        model: User,
        as: "UnsuspendedBy",
        attributes: ["id", "username", "email", "role", "profilePicture"],
        required: false,
      },
    ];

    const fullRequest = await UserSuspend.findOne({
      where: { suspendCode: suspendCode },
      include: includeModels,
    });

    if (!fullRequest) {
      return res.status(404).json({
        success: false,
        message: "Data suspend tidak ditemukan",
      });
    }

    //admin cant see suspend data for other admin/super-admin
    const targetUserRole = fullRequest.User.role;

    if (["admin", "super-admin"].includes(targetUserRole)) {
      if (requestingUser.role === "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Akses ditolak. Data suspend admin hanya dapat dilihat oleh super-admin",
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: fullRequest,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
//suspend account (admin)
exports.suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, reason, suspendUntil } = req.body;
    const admin = req.user;
    const adminId = admin.id;

    if (userId === adminId) {
      return res.status(409).json({
        success: false,
        message: "Tidak bisa suspend diri sendiri",
      });
    }

    //check user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }
    //role check
    if (
      admin.role === "admin" &&
      ["admin", "super-admin"].includes(user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Tidak dapat suspend user",
      });
    }
    if (admin.role === "super-admin" && user.role === "super-admin") {
      return res.status(403).json({
        success: false,
        message: "Tidak dapat suspend user",
      });
    }
    //check already suspended
    if (
      user.accountStatus === "suspended" ||
      user.accountStatus === "suspended-temp"
    ) {
      const activeSuspend = await UserSuspend.findOne({
        where: {
          userId,
          unsuspendedAt: null,
        },
        order: [["createdAt", "DESC"]],
      });

      if (activeSuspend) {
        return res.status(400).json({
          success: false,
          message: "User sudah dalam status suspended",
        });
      }
    }

    //create suspend record
    const suspendData = {
      userId,
      type,
      reason,
      suspendedBy: adminId,
      suspendedAt: new Date(),
    };

    if (type === "temporary") {
      suspendData.suspendUntil = new Date(suspendUntil);
    }
    await UserSuspend.create(suspendData);

    //update account status
    const newStatus = type === "permanent" ? "suspended" : "suspended-temp";
    await user.update({
      accountStatus: newStatus,
      updatedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `User berhasil di-suspend ${
        type === "permanent" ? "permanen" : "sementara"
      }`,
      data: {
        userId: user.id,
        username: user.username,
        type,
        reason,
        suspendUntil: type === "temporary" ? suspendUntil : null,
        accountStatus: newStatus,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
//unsuspend account (admin)
exports.unsuspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { unsuspendReason } = req.body;
    const admin = req.user;
    const adminId = admin.id;

    if (userId === adminId) {
      return res.status(409).json({
        success: false,
        message: "Tidak bisa unsuspend diri sendiri",
      });
    }

    //check user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }
    //check if currently suspended
    if (
      user.accountStatus !== "suspended" &&
      user.accountStatus !== "suspended-temp"
    ) {
      return res.status(400).json({
        success: false,
        message: "User tidak dalam status suspended",
      });
    }
    //role check
    if (
      admin.role === "admin" &&
      ["admin", "super-admin"].includes(user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Tidak dapat unsuspend user",
      });
    }
    if (admin.role === "super-admin" && user.role === "super-admin") {
      return res.status(403).json({
        success: false,
        message: "Tidak dapat unsuspend user",
      });
    }

    //find active suspend
    const activeSuspend = await UserSuspend.findOne({
      where: {
        userId,
        unsuspendedAt: null,
      },
      order: [["createdAt", "DESC"]],
    });
    if (!activeSuspend) {
      return res.status(400).json({
        success: false,
        message: "Tidak ada suspend aktif untuk user ini",
      });
    }

    //check waiting period
    const suspendedAt = moment(activeSuspend.suspendedAt);
    const now = moment();
    const daysPassed = now.diff(suspendedAt, "days");

    //permanent
    if (activeSuspend.type === "permanent") {
      if (daysPassed < 7) {
        const daysLeft = 7 - daysPassed;
        return res.status(400).json({
          success: false,
          message: `User permanent suspend baru dapat di-unsuspend setelah 7 hari. Masih ${daysLeft} hari lagi.`,
        });
      }
    }
    //temporary
    if (activeSuspend.type === "temporary") {
      if (daysPassed < 1) {
        const hoursPassed = now.diff(suspendedAt, "hours");
        const hoursLeft = 24 - hoursPassed;
        return res.status(400).json({
          success: false,
          message: `User temporary suspend baru dapat di-unsuspend setelah 24 jam. Tunggu ${hoursLeft} jam lagi.`,
        });
      }
    }

    const transaction = await sequelize.transaction();
    try {
      //suspend record update
      await activeSuspend.update(
        {
          unsuspendedAt: new Date(),
          unsuspendedBy: adminId,
          unsuspendReason: unsuspendReason.trim(),
          updatedAt: new Date(),
        },
        { transaction }
      );

      let newAccountStatus = "active";

      //other active suspends
      const otherActiveSuspends = await UserSuspend.count({
        where: {
          userId,
          unsuspendedAt: null,
          id: { [Op.ne]: activeSuspend.id },
        },
        transaction,
      });

      //keep suspended status if exist
      if (otherActiveSuspends > 0) {
        const permanentActive = await UserSuspend.findOne({
          where: {
            userId,
            unsuspendedAt: null,
            type: "permanent",
            id: { [Op.ne]: activeSuspend.id },
          },
          transaction,
        });

        newAccountStatus = permanentActive ? "suspended" : "suspended-temp";
      }

      //accountStatus update
      await user.update(
        {
          accountStatus: newAccountStatus,
          updatedAt: new Date(),
        },
        { transaction }
      );

      await transaction.commit();

      const responseData = {
        success: true,
        message: "User berhasil di-unsuspend",
        data: {
          userId: user.id,
          username: user.username,
          suspendCode: activeSuspend.suspendCode,
          type: activeSuspend.type,
          unsuspendedAt: new Date(),
          unsuspendedBy: adminId,
          newAccountStatus: newAccountStatus,
        },
      };

      return res.status(200).json(responseData);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/*
  REGISTER REQUESTS
*/
//get register requests
exports.getRegisterRequests = async (req, res) => {
  try {
    //queries
    let { status, role, country, page = 1, limit = 30, search } = req.query;

    page = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.min(
      [30, 50, 80].includes(parseInt(limit, 10)) ? parseInt(limit, 10) : 30,
      80
    );
    const offset = (page - 1) * limit;

    const allowedStatus = ["pending", "approved", "rejected"];
    let statusCondition;
    if (!status) {
      statusCondition = { [Op.not]: "pending" };
    } else if (!allowedStatus.includes(status)) {
      status = "pending";
      statusCondition = status;
    } else {
      statusCondition = status;
    }

    const allowedRoles = ["job-seeker", "company"];
    if (!allowedRoles.includes(role)) role = null;

    //include
    const includeModels = [
      {
        model: User,
        attributes: [
          "id",
          "username",
          "email",
          "role",
          "accountStatus",
          "authProvider",
        ],
        required: true,
        include: [],
      },
    ];

    //filter country js
    if (!role || role === "job-seeker") {
      includeModels[0].include.push({
        model: UserProfile,
        attributes: ["fullName", "country", "city"],
        required: role === "job-seeker",
        where: country
          ? { country: { [Op.like]: country.toLowerCase() } }
          : undefined,
      });
    }

    //filter country cm
    if (!role || role === "company") {
      includeModels[0].include.push({
        model: Company,
        attributes: ["companyName", "country", "city"],
        required: role === "company",
        where: country
          ? { country: { [Op.like]: country.toLowerCase() } }
          : undefined,
      });
    }

    //where condition
    const whereConditions = {};
    if (status) {
      whereConditions.status = status;
    } else {
      whereConditions.status = { [Op.ne]: "pending" };
    }

    if (role) {
      whereConditions["$User.role$"] = role;
    }
    if (search) {
      const searchPattern = `%${search}%`;

      whereConditions[Op.or] = [
        // Search in RegisterRequest table
        { registerCode: { [Op.like]: searchPattern } },

        // Search in User table
        { "$User.username$": { [Op.like]: searchPattern } },
        { "$User.email$": { [Op.like]: searchPattern } },

        // Search in UserProfile table (if it exists)
        { "$User.UserProfile.fullName$": { [Op.like]: searchPattern } },

        // Search in Company table (if it exists)
        { "$User.Company.companyName$": { [Op.like]: searchPattern } },
      ];
    }

    const { rows, count } = await RegisterRequest.findAndCountAll({
      where: whereConditions,
      include: includeModels,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    const totalPages = Math.ceil(count / limit);

    return res.json({
      success: true,
      data: rows,
      meta: {
        total: count,
        page,
        limit,
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
//get register req by RQS
exports.getRegisterRequestByRQS = async (req, res) => {
  try {
    const suspendCode = req.params.rqsCode;

    if (!suspendCode) {
      return res.status(400).json({
        success: false,
        message: "Kode register tidak ada",
      });
    }

    const includeModels = [
      {
        model: User,
        attributes: [
          "id",
          "username",
          "email",
          "role",
          "authProvider",
          "accountStatus",
          "createdAt",
        ],
        required: true,
        include: [
          {
            model: UserProfile,
            attributes: ["fullName", "country", "city", "gender"],
            required: false,
          },
          {
            model: Company,
            attributes: [
              "companyName",
              "country",
              "city",
              "industryId",
              "websiteLink",
            ],
            required: false,
            include: [
              {
                model: Industry,
              },
            ],
          },
        ],
      },
      {
        model: User,
        as: "Admin",
        attributes: ["id", "username", "email", "role", "profilePicture"],
        required: false,
      },
    ];

    const fullRequest = await RegisterRequest.findOne({
      where: { registerCode: suspendCode },
      include: includeModels,
    });

    if (!fullRequest) {
      return res.status(404).json({
        success: false,
        message: "Data register tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      data: fullRequest,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
//update registration status
exports.updateRegistrationStatus = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { userId, rqsCode } = req.params;
    const { status, reason } = req.body;
    const adminId = req.user.id;

    if (!userId || !rqsCode) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "ID user dan kode register diperlukan",
      });
    }

    const registerRequest = await RegisterRequest.findOne({
      where: {
        registerCode: rqsCode,
        userId: userId,
      },
      include: [
        {
          model: User,
          attributes: ["id", "username", "email", "role", "accountStatus"],
          required: true,
        },
      ],
      transaction,
    });

    if (!registerRequest) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Permintaan registrasi tidak ditemukan",
      });
    }
    if (registerRequest.status !== "pending") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Permintaan registrasi sudah diproses sebelumnya",
      });
    }

    const user = registerRequest.User;
    if (user.accountStatus !== "requested") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Status pengguna tidak valid untuk diproses",
      });
    }

    //updates
    registerRequest.status = status;
    registerRequest.reason = reason;
    registerRequest.adminId = adminId;
    await registerRequest.save({ transaction });

    const newUserStatus = status === "approved" ? "active" : "rejected";
    user.accountStatus = newUserStatus;
    await user.save({ transaction });

    await transaction.commit();

    //send email
    sendRegistrationDecisionEmail({
      to: user.email,
      username: user.username,
      role: user.role,
      decision: status,
      reason: reason,
      registerCode: rqsCode,
    }).catch((err) => console.error("Email error:", err));

    //response
    const responseData = {
      registerRequest: {
        id: registerRequest.id,
        registerCode: registerRequest.registerCode,
        status: registerRequest.status,
        reason: registerRequest.reason,
        adminId: registerRequest.adminId,
        updatedAt: registerRequest.updatedAt,
      },
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        accountStatus: user.accountStatus,
      },
    };

    return res.status(200).json({
      success: true,
      message: `Registrasi berhasil ${
        status === "approved" ? "disetujui" : "ditolak"
      }`,
      data: responseData,
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
