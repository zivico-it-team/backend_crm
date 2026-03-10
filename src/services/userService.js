const { DataTypes, Op } = require("sequelize");

const { sequelize } = require("../config/db");
const User = require("../models/User");
const Role = require("../models/Role");
const UserProfessional = require("../models/UserProfessional");
const UserBank = require("../models/UserBank");
const UserEmergencyContact = require("../models/UserEmergencyContact");

const ROLE_NAMES = ["admin", "manager", "employee"];

const USER_FIELDS = [
  "userName",
  "password",
  "name",
  "email",
  "phone",
  "dob",
  "gender",
  "nationality",
  "bio",
  "skills",
  "addressLine",
  "city",
  "state",
  "postalCode",
  "documents",
  "profileImageUrl",
  "profileImageFileName",
];

const PROFESSIONAL_FIELDS = [
  "employeeId",
  "designation",
  "teamName",
  "department",
  "employmentType",
  "joiningDate",
  "reportingManager",
  "workLocation",
  "leaveBalance",
  "leaveBalances",
];

const BANK_FIELDS = [
  "bankName",
  "accountHolder",
  "accountNumberMasked",
  "accountNumber",
  "branch",
  "ifscCode",
];

const EMERGENCY_FIELDS = ["name", "phone", "relationship", "email"];

const EMPTY_PROFESSIONAL = {
  employeeId: "",
  designation: "",
  teamName: "",
  department: "",
  employmentType: "",
  joiningDate: null,
  reportingManager: "",
  workLocation: "",
  leaveBalance: {},
  leaveBalances: {},
};

const EMPTY_BANK = {
  bankName: "",
  accountHolder: "",
  accountNumberMasked: "",
  accountNumber: "",
  branch: "",
  ifscCode: "",
};

const EMPTY_EMERGENCY = {
  name: "",
  phone: "",
  relationship: "",
  email: "",
};

const pickDefined = (obj = {}, keys = []) =>
  keys.reduce((acc, key) => {
    if (obj[key] !== undefined) acc[key] = obj[key];
    return acc;
  }, {});

const normalizeString = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return String(value).trim();
};

const normalizeLowerString = (value) => {
  const normalized = normalizeString(value);
  return normalized === undefined || normalized === null ? normalized : normalized.toLowerCase();
};

const normalizeDate = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeArray = (value) => {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeJsonObject = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  return {};
};

const hasMeaningfulValues = (value = {}) =>
  Object.values(value).some((entry) => {
    if (entry === undefined || entry === null) return false;
    if (typeof entry === "string") return entry.trim() !== "";
    if (Array.isArray(entry)) return entry.length > 0;
    if (typeof entry === "object") return Object.keys(entry).length > 0;
    return true;
  });

const cleanRelationObject = (value, defaults) => {
  const source =
    value && typeof value.toJSON === "function"
      ? value.toJSON()
      : value && typeof value === "object"
        ? value
        : {};

  const out = { ...defaults };

  for (const [key, entry] of Object.entries(source)) {
    if (["id", "userId", "createdAt", "updatedAt"].includes(key)) continue;
    out[key] = entry;
  }

  return out;
};

const parseMaybeJson = (value) => {
  if (value === null || value === undefined || value === "") return {};
  if (typeof value === "object") return value;
  if (typeof value !== "string") return {};

  try {
    return JSON.parse(value);
  } catch (_error) {
    return {};
  }
};

const normalizeProfessional = (value = {}) => {
  const picked = pickDefined(value, PROFESSIONAL_FIELDS);

  if (picked.employeeId !== undefined) picked.employeeId = normalizeString(picked.employeeId) || "";
  if (picked.designation !== undefined) picked.designation = normalizeString(picked.designation) || "";
  if (picked.teamName !== undefined) picked.teamName = normalizeString(picked.teamName) || "";
  if (picked.department !== undefined) picked.department = normalizeString(picked.department) || "";
  if (picked.employmentType !== undefined) picked.employmentType = normalizeString(picked.employmentType) || "";
  if (picked.joiningDate !== undefined) picked.joiningDate = normalizeDate(picked.joiningDate);
  if (picked.reportingManager !== undefined) picked.reportingManager = normalizeString(picked.reportingManager) || "";
  if (picked.workLocation !== undefined) picked.workLocation = normalizeString(picked.workLocation) || "";
  if (picked.leaveBalance !== undefined) picked.leaveBalance = normalizeJsonObject(picked.leaveBalance);
  if (picked.leaveBalances !== undefined) picked.leaveBalances = normalizeJsonObject(picked.leaveBalances);

  return picked;
};

const normalizeBank = (value = {}) => {
  const picked = pickDefined(value, BANK_FIELDS);

  for (const key of BANK_FIELDS) {
    if (picked[key] !== undefined) picked[key] = normalizeString(picked[key]) || "";
  }

  return picked;
};

const normalizeEmergencyContact = (value = {}) => {
  const picked = pickDefined(value, EMERGENCY_FIELDS);

  for (const key of EMERGENCY_FIELDS) {
    if (picked[key] !== undefined) picked[key] = normalizeString(picked[key]) || "";
  }

  return picked;
};

const normalizeUserFields = (value = {}) => {
  const picked = pickDefined(value, USER_FIELDS);

  if (picked.userName !== undefined) picked.userName = normalizeString(picked.userName);
  if (picked.password !== undefined) picked.password = String(picked.password);
  if (picked.name !== undefined) picked.name = normalizeString(picked.name);
  if (picked.email !== undefined) picked.email = normalizeLowerString(picked.email);
  if (picked.phone !== undefined) picked.phone = normalizeString(picked.phone) || "";
  if (picked.dob !== undefined) picked.dob = normalizeDate(picked.dob);
  if (picked.gender !== undefined) picked.gender = normalizeString(picked.gender) || "Not specified";
  if (picked.nationality !== undefined) picked.nationality = normalizeString(picked.nationality) || "";
  if (picked.bio !== undefined) picked.bio = normalizeString(picked.bio) || "";
  if (picked.skills !== undefined) picked.skills = normalizeArray(picked.skills);
  if (picked.addressLine !== undefined) picked.addressLine = normalizeString(picked.addressLine) || "";
  if (picked.city !== undefined) picked.city = normalizeString(picked.city) || "";
  if (picked.state !== undefined) picked.state = normalizeString(picked.state) || "";
  if (picked.postalCode !== undefined) picked.postalCode = normalizeString(picked.postalCode) || "";
  if (picked.documents !== undefined) picked.documents = Array.isArray(picked.documents) ? picked.documents : [];
  if (picked.profileImageUrl !== undefined) picked.profileImageUrl = normalizeString(picked.profileImageUrl) || "";
  if (picked.profileImageFileName !== undefined) {
    picked.profileImageFileName = normalizeString(picked.profileImageFileName) || "";
  }

  return picked;
};

const buildRoleInclude = (roleNames, attributes = ["id", "name"]) => {
  const include = {
    model: Role,
    as: "roleInfo",
    attributes,
    required: true,
  };

  if (roleNames) {
    include.where = Array.isArray(roleNames) ? { name: { [Op.in]: roleNames } } : { name: roleNames };
  }

  return include;
};

const buildUserInclude = ({ roleNames, includeRelations = true } = {}) => {
  const include = [buildRoleInclude(roleNames)];

  if (includeRelations) {
    include.push(
      { model: UserProfessional, as: "professionalInfo", required: false },
      { model: UserBank, as: "bankInfo", required: false },
      { model: UserEmergencyContact, as: "emergencyContactInfo", required: false }
    );
  }

  return include;
};

const buildUserQueryOptions = ({
  roleNames,
  includePassword = false,
  includeRelations = true,
  where,
  order,
  attributes,
  transaction,
} = {}) => ({
  ...(where ? { where } : {}),
  ...(order ? { order } : {}),
  ...(transaction ? { transaction } : {}),
  attributes: attributes || (includePassword ? undefined : { exclude: ["password"] }),
  include: buildUserInclude({ roleNames, includeRelations }),
});

const serializeUser = (user, { includePassword = false } = {}) => {
  if (!user) return null;

  const obj = typeof user.toJSON === "function" ? user.toJSON() : { ...user };
  const out = { ...obj };

  out.role = obj.roleInfo?.name || obj.role || "employee";
  out.professional = cleanRelationObject(obj.professionalInfo || obj.professional, EMPTY_PROFESSIONAL);
  out.bank = cleanRelationObject(obj.bankInfo || obj.bank, EMPTY_BANK);
  out.emergencyContact = cleanRelationObject(
    obj.emergencyContactInfo || obj.emergencyContact,
    EMPTY_EMERGENCY
  );
  out._id = obj.id;

  delete out.roleInfo;
  delete out.professionalInfo;
  delete out.bankInfo;
  delete out.emergencyContactInfo;
  delete out.roleId;

  if (!includePassword) delete out.password;

  return out;
};

const serializeUsers = (users = [], options = {}) => users.map((user) => serializeUser(user, options));

const getRoleNameMap = async (transaction) => {
  const roles = await Role.findAll({ transaction });
  return new Map(roles.map((role) => [role.name, role.id]));
};

const resolveRoleId = async (roleName = "employee", transaction) => {
  const name = ROLE_NAMES.includes(roleName) ? roleName : "employee";
  const role = await Role.findOne({ where: { name }, transaction });

  if (!role) {
    throw new Error(`Role "${name}" is not configured`);
  }

  return role.id;
};

const syncOneToOneRelation = async (Model, userId, payload, transaction) => {
  if (payload === undefined) return;
  if (payload === null) {
    await Model.destroy({ where: { userId }, transaction });
    return;
  }

  const data = pickDefined(payload, Object.keys(payload));
  if (!Object.keys(data).length) return;

  const existing = await Model.findOne({ where: { userId }, transaction });
  if (existing) {
    await existing.update(data, { transaction });
    return;
  }

  await Model.create({ userId, ...data }, { transaction });
};

const findUserByPkWithRelations = (id, options = {}) =>
  User.findByPk(id, buildUserQueryOptions(options));

const findOneUserWithRelations = ({ where, roleNames, includePassword = false, transaction } = {}) =>
  User.findOne(buildUserQueryOptions({ where, roleNames, includePassword, transaction }));

const findAllUsersWithRelations = ({
  where,
  roleNames,
  includePassword = false,
  order,
  attributes,
  transaction,
} = {}) =>
  User.findAll(
    buildUserQueryOptions({
      where,
      roleNames,
      includePassword,
      order,
      attributes,
      transaction,
    })
  );

const countUsersWithRole = async (roleNames, where = {}, transaction) =>
  User.count({
    where,
    transaction,
    distinct: true,
    col: "User.id",
    include: [buildRoleInclude(roleNames, ["id"])],
  });

const createUserWithRelations = async (payload = {}, options = {}) =>
  sequelize.transaction(async (transaction) => {
    const roleId = await resolveRoleId(payload.role || "employee", transaction);
    const userPayload = normalizeUserFields(payload);
    const professionalPayload =
      payload.professional && typeof payload.professional === "object"
        ? normalizeProfessional(payload.professional)
        : undefined;
    const bankPayload =
      payload.bank && typeof payload.bank === "object" ? normalizeBank(payload.bank) : undefined;
    const emergencyPayload =
      payload.emergencyContact && typeof payload.emergencyContact === "object"
        ? normalizeEmergencyContact(payload.emergencyContact)
        : undefined;

    const user = await User.create({ ...userPayload, roleId }, { transaction });

    await syncOneToOneRelation(UserProfessional, user.id, professionalPayload, transaction);
    await syncOneToOneRelation(UserBank, user.id, bankPayload, transaction);
    await syncOneToOneRelation(UserEmergencyContact, user.id, emergencyPayload, transaction);

    return findUserByPkWithRelations(user.id, {
      includePassword: options.includePassword,
      transaction,
    });
  });

const updateUserWithRelations = async (userOrId, payload = {}, options = {}) =>
  sequelize.transaction(async (transaction) => {
    const userId = typeof userOrId === "string" ? userOrId : userOrId?.id;
    if (!userId) throw new Error("user id is required");

    const user =
      typeof userOrId === "string"
        ? await User.findByPk(userId, { transaction })
        : userOrId;

    if (!user) throw new Error("User not found");

    const userPayload = normalizeUserFields(payload);
    if (payload.role !== undefined) {
      userPayload.roleId = await resolveRoleId(payload.role, transaction);
    }

    if (Object.keys(userPayload).length > 0) {
      await user.update(userPayload, { transaction });
    }

    if (payload.professional !== undefined) {
      await syncOneToOneRelation(
        UserProfessional,
        userId,
        normalizeProfessional(payload.professional || {}),
        transaction
      );
    }

    if (payload.bank !== undefined) {
      await syncOneToOneRelation(UserBank, userId, normalizeBank(payload.bank || {}), transaction);
    }

    if (payload.emergencyContact !== undefined) {
      await syncOneToOneRelation(
        UserEmergencyContact,
        userId,
        normalizeEmergencyContact(payload.emergencyContact || {}),
        transaction
      );
    }

    return findUserByPkWithRelations(userId, {
      includePassword: options.includePassword,
      transaction,
    });
  });

const seedRoles = async () => {
  await Role.bulkCreate(
    [
      { name: "admin", description: "System administrator" },
      { name: "manager", description: "Team manager" },
      { name: "employee", description: "Employee" },
    ],
    { ignoreDuplicates: true }
  );
};

const ensureNormalizedUserSchema = async () => {
  const queryInterface = sequelize.getQueryInterface();

  await sequelize.sync();

  const userTable = await queryInterface.describeTable("users");
  if (!userTable.roleId) {
    await queryInterface.addColumn("users", "roleId", {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "roles", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  }
};

const backfillNormalizedUserData = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const table = await queryInterface.describeTable("users");
  const columns = ["id"];

  if (table.roleId) columns.push("roleId");
  if (table.role) columns.push("role");
  if (table.professional) columns.push("professional");
  if (table.bank) columns.push("bank");
  if (table.emergencyContact) columns.push("emergencyContact");

  if (columns.length <= 1) return;

  const [rows] = await sequelize.query(
    `SELECT ${columns.map((column) => `\`${column}\``).join(", ")} FROM \`users\``
  );

  if (!rows.length) return;

  const [roleMap, professionalRows, bankRows, emergencyRows] = await Promise.all([
    getRoleNameMap(),
    UserProfessional.findAll({ attributes: ["userId"] }),
    UserBank.findAll({ attributes: ["userId"] }),
    UserEmergencyContact.findAll({ attributes: ["userId"] }),
  ]);

  const professionalSet = new Set(professionalRows.map((row) => String(row.userId)));
  const bankSet = new Set(bankRows.map((row) => String(row.userId)));
  const emergencySet = new Set(emergencyRows.map((row) => String(row.userId)));

  await sequelize.transaction(async (transaction) => {
    for (const row of rows) {
      const userId = String(row.id);
      const legacyRole = ROLE_NAMES.includes(row.role) ? row.role : "employee";
      const roleId = roleMap.get(legacyRole) || roleMap.get("employee");

      if (table.roleId && roleId && !row.roleId) {
        await User.update({ roleId }, { where: { id: userId }, transaction });
      }

      if (table.professional && !professionalSet.has(userId)) {
        const professional = normalizeProfessional(parseMaybeJson(row.professional));
        if (hasMeaningfulValues(professional)) {
          await UserProfessional.create({ userId, ...professional }, { transaction });
        }
      }

      if (table.bank && !bankSet.has(userId)) {
        const bank = normalizeBank(parseMaybeJson(row.bank));
        if (hasMeaningfulValues(bank)) {
          await UserBank.create({ userId, ...bank }, { transaction });
        }
      }

      if (table.emergencyContact && !emergencySet.has(userId)) {
        const emergencyContact = normalizeEmergencyContact(parseMaybeJson(row.emergencyContact));
        if (hasMeaningfulValues(emergencyContact)) {
          await UserEmergencyContact.create({ userId, ...emergencyContact }, { transaction });
        }
      }
    }
  });
};

module.exports = {
  ROLE_NAMES,
  buildRoleInclude,
  buildUserInclude,
  buildUserQueryOptions,
  serializeUser,
  serializeUsers,
  findUserByPkWithRelations,
  findOneUserWithRelations,
  findAllUsersWithRelations,
  countUsersWithRole,
  createUserWithRelations,
  updateUserWithRelations,
  ensureNormalizedUserSchema,
  seedRoles,
  backfillNormalizedUserData,
};
