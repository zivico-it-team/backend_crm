const {
  serializeUser,
  findUserByPkWithRelations,
  updateUserWithRelations,
} = require("../services/userService");

// helper: allowed fields only (security)
const pick = (obj, keys) =>
  keys.reduce((acc, k) => {
    if (obj?.[k] !== undefined) acc[k] = obj[k];
    return acc;
  }, {});

// GET /api/profile/me
exports.getMyProfile = async (req, res, next) => {
  try {
    const user = await findUserByPkWithRelations(req.user.id || req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.json({ success: true, data: serializeUser(user) });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/profile/me
exports.updateMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;

    const personalAllowed = [
      "fullName", // maps to name
      "phone",
      "dob",
      "gender",
      "nationality",
      "addressLine",
      "city",
      "state",
      "postalCode",
      "bio",
      "skills",
    ];

    const professionalAllowed = [
      "employeeId",
      "designation",
      "teamName",
      "department",
      "employmentType",
      "joiningDate",
      "reportingManager",
      "workLocation",
    ];

    const emergencyAllowed = ["name", "phone", "relationship", "email"];
    const bankAllowed = ["bankName", "accountHolder", "accountNumberMasked", "accountNumber", "branch", "ifscCode"];

    const updateDoc = {
      ...pick(req.body, personalAllowed),
    };

    if (updateDoc.fullName !== undefined) {
      updateDoc.name = updateDoc.fullName;
      delete updateDoc.fullName;
    }

    if (req.body?.professional && typeof req.body.professional === "object") {
      updateDoc.professional = pick(req.body.professional, professionalAllowed);
    }
    if (req.body?.emergencyContact && typeof req.body.emergencyContact === "object") {
      updateDoc.emergencyContact = pick(req.body.emergencyContact, emergencyAllowed);
    }
    if (req.body?.bank && typeof req.body.bank === "object") {
      updateDoc.bank = pick(req.body.bank, bankAllowed);
    }

    if (updateDoc.dob) updateDoc.dob = new Date(updateDoc.dob);
    if (updateDoc?.professional?.joiningDate) updateDoc.professional.joiningDate = new Date(updateDoc.professional.joiningDate);

    const user = await findUserByPkWithRelations(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const updated = await updateUserWithRelations(userId, updateDoc);

    return res.json({ success: true, message: "Profile updated", data: serializeUser(updated) });
  } catch (err) {
    next(err);
  }
};
