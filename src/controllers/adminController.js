const User = require("../models/User");
const bcrypt = require("bcryptjs");

const {
  serializeUser,
  serializeUsers,
  createUserWithRelations,
  updateUserWithRelations,
  findUserByPkWithRelations,
  findOneUserWithRelations,
  findAllUsersWithRelations,
} = require("../services/userService");

const extractProfessional = (payload = {}, existingProfessional = {}) => {
  const professionalPayload = payload.professional || {};

  return {
    ...existingProfessional,
    ...professionalPayload,
    employeeId:
      professionalPayload.employeeId ??
      payload.employeeId ??
      existingProfessional.employeeId ??
      "",
    designation:
      professionalPayload.designation ??
      payload.designation ??
      existingProfessional.designation ??
      "",
    department:
      professionalPayload.department ??
      payload.department ??
      existingProfessional.department ??
      "",
  };
};

const handleAdminUserError = (res, err) => {
  if (err?.name === "SequelizeUniqueConstraintError") {
    const duplicateField = err.errors?.[0]?.path || "field";
    return res.status(409).json({ message: `${duplicateField} already exists` });
  }

  if (err?.name === "SequelizeValidationError") {
    return res.status(400).json({ message: err.errors?.[0]?.message || "Validation failed" });
  }

  return res.status(500).json({ message: err.message || "Server error" });
};

const buildCreatePayload = async (req, role) => ({
  name: req.body.name,
  email: req.body.email,
  phone: req.body.phone,
  userName: req.body.userName,
  password: await bcrypt.hash(req.body.password, 10),
  role,
  professional: extractProfessional(req.body),
  emergencyContact: req.body.emergencyContact || {},
  bank: req.body.bank || {},
  documents: req.body.documents || [],
  profileImageUrl: req.body.profileImageUrl || "",
  profileImageFileName: req.body.profileImageFileName || "",
  dob: req.body.dob || null,
  gender: req.body.gender || "Not specified",
  nationality: req.body.nationality || "",
  addressLine: req.body.addressLine || "",
  city: req.body.city || "",
  state: req.body.state || "",
  postalCode: req.body.postalCode || "",
  bio: req.body.bio || "",
  skills: req.body.skills || [],
});

const buildUpdatePayload = async (req, existingUser) => {
  const allowed = [
    "name",
    "userName",
    "email",
    "phone",
    "dob",
    "gender",
    "nationality",
    "addressLine",
    "city",
    "state",
    "postalCode",
    "documents",
    "profileImageUrl",
    "profileImageFileName",
    "bio",
    "skills",
  ];

  const update = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }

  if (
    req.body.professional !== undefined ||
    req.body.employeeId !== undefined ||
    req.body.designation !== undefined ||
    req.body.department !== undefined
  ) {
    update.professional = extractProfessional(req.body, existingUser.professional || {});
  }

  if (req.body.bank !== undefined) update.bank = req.body.bank || {};
  if (req.body.emergencyContact !== undefined) update.emergencyContact = req.body.emergencyContact || {};

  if (req.body.password && String(req.body.password).trim()) {
    update.password = await bcrypt.hash(req.body.password, 10);
  }

  return update;
};

const requireUserByRole = (id, roleName) =>
  findOneUserWithRelations({ where: { id }, roleNames: roleName });

// Admin -> Add Manager
const addManager = async (req, res) => {
  try {
    const { name, userName, email, password } = req.body;

    if (!name || !userName || !email || !password) {
      return res.status(400).json({ message: "name, userName, email and password are required" });
    }

    const manager = await createUserWithRelations(await buildCreatePayload(req, "manager"));
    res.status(201).json(serializeUser(manager));
  } catch (err) {
    return handleAdminUserError(res, err);
  }
};

// Admin + Manager -> Add Employee
const addEmployee = async (req, res) => {
  try {
    const { name, userName, email, password } = req.body;

    if (!name || !userName || !email || !password) {
      return res.status(400).json({ message: "name, userName, email and password are required" });
    }

    const employee = await createUserWithRelations(await buildCreatePayload(req, "employee"));
    res.status(201).json(serializeUser(employee));
  } catch (err) {
    return handleAdminUserError(res, err);
  }
};

// GET all managers
const getManagers = async (req, res) => {
  try {
    const managers = await findAllUsersWithRelations({
      roleNames: "manager",
      order: [["createdAt", "DESC"]],
    });

    res.json(serializeUsers(managers));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET single manager by id
const getManagerById = async (req, res) => {
  try {
    const manager = await requireUserByRole(req.params.id, "manager");

    if (!manager) return res.status(404).json({ message: "Manager not found" });
    res.json(serializeUser(manager));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE manager by id (Admin only)
const updateManager = async (req, res) => {
  try {
    const id = req.params.id;

    if (req.body.role && req.body.role !== "manager") {
      return res.status(400).json({ message: "Role change not allowed here" });
    }

    const manager = await requireUserByRole(id, "manager");
    if (!manager) return res.status(404).json({ message: "Manager not found" });

    const updated = await updateUserWithRelations(id, await buildUpdatePayload(req, serializeUser(manager)));
    res.json(serializeUser(updated));
  } catch (err) {
    return handleAdminUserError(res, err);
  }
};

// DELETE manager by id (Admin only)
const deleteManager = async (req, res) => {
  try {
    const id = req.params.id;

    if (req.user && String(req.user._id) === String(id)) {
      return res.status(400).json({ message: "You can't delete your own account" });
    }

    const manager = await requireUserByRole(id, "manager");
    if (!manager) return res.status(404).json({ message: "Manager not found" });

    await manager.destroy();
    res.json({ message: "Manager deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET all employees
const getEmployees = async (req, res) => {
  try {
    const employees = await findAllUsersWithRelations({
      roleNames: "employee",
      order: [["createdAt", "DESC"]],
    });
    res.json(serializeUsers(employees));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET single employee by id
const getEmployeeById = async (req, res) => {
  try {
    const employee = await requireUserByRole(req.params.id, "employee");
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(serializeUser(employee));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE employee by id (Admin/Manager)
const updateEmployee = async (req, res) => {
  try {
    const id = req.params.id;

    if (req.body.role && req.body.role !== "employee") {
      return res.status(400).json({ message: "Role change not allowed here" });
    }

    const employee = await requireUserByRole(id, "employee");
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const updated = await updateUserWithRelations(id, await buildUpdatePayload(req, serializeUser(employee)));
    res.json(serializeUser(updated));
  } catch (err) {
    return handleAdminUserError(res, err);
  }
};

// DELETE employee by id (Admin/Manager)
const deleteEmployee = async (req, res) => {
  try {
    const id = req.params.id;

    if (req.user && String(req.user._id) === String(id)) {
      return res.status(400).json({ message: "You can't delete your own account" });
    }

    const employee = await requireUserByRole(id, "employee");
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    await employee.destroy();
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET admin profile (Admin only)
const getAdminProfile = async (req, res) => {
  try {
    const admin = await findUserByPkWithRelations(req.user._id);

    if (!admin) return res.status(404).json({ message: "Admin not found" });
    const adminData = serializeUser(admin);
    if (adminData.role !== "admin") return res.status(403).json({ message: "Admin only" });
    res.json({ user: adminData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE admin profile (Admin only)
const updateAdminProfile = async (req, res) => {
  try {
    const admin = await findUserByPkWithRelations(req.user._id);

    if (!admin) return res.status(404).json({ message: "Admin not found" });
    const adminData = serializeUser(admin);
    if (adminData.role !== "admin") return res.status(403).json({ message: "Admin only" });

    if (req.body.email && req.body.email !== adminData.email) {
      return res.status(400).json({ message: "Email cannot be changed" });
    }

    const updated = await updateUserWithRelations(req.user._id, {
      name: req.body.name,
      phone: req.body.phone,
      dob: req.body.dob,
      gender: req.body.gender,
      city: req.body.city,
      state: req.body.state,
      nationality: req.body.nationality,
      addressLine: req.body.addressLine,
      postalCode: req.body.postalCode,
      profileImageUrl: req.body.profileImageUrl,
      profileImageFileName: req.body.profileImageFileName,
      bio: req.body.bio,
      skills: req.body.skills,
    });

    res.json({ message: "Profile updated", user: serializeUser(updated) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CHANGE admin password (Admin only)
const changeAdminPassword = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        message: "currentPassword, newPassword, confirmNewPassword are required",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const admin = await User.findByPk(adminId);
    const adminWithRole = await findUserByPkWithRelations(adminId);

    if (!admin) return res.status(404).json({ message: "Admin not found" });
    if (!adminWithRole) return res.status(404).json({ message: "Admin not found" });
    const adminData = serializeUser(adminWithRole);
    if (adminData.role !== "admin") return res.status(403).json({ message: "Admin only" });

    const ok = await bcrypt.compare(currentPassword, admin.password);
    if (!ok) return res.status(400).json({ message: "Current password is incorrect" });

    await admin.update({ password: await bcrypt.hash(newPassword, 10) });

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  addManager,
  addEmployee,

  getManagers,
  getManagerById,
  updateManager,
  deleteManager,

  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,

  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
};
