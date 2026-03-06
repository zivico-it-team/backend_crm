const User = require("../models/User");

// helper: allowed fields only (security)
const pick = (obj, keys) =>
  keys.reduce((acc, k) => {
    if (obj?.[k] !== undefined) acc[k] = obj[k];
    return acc;
  }, {});

// GET /api/profile/me
exports.getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id || req.user._id, {
      attributes: { exclude: ["password"] },
    });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const u = user.toJSON();
    u._id = u.id;

    return res.json({ success: true, data: u });
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

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    await user.update(updateDoc);

    const updated = await User.findByPk(userId, { attributes: { exclude: ["password"] } });
    const u = updated.toJSON();
    u._id = u.id;

    return res.json({ success: true, message: "Profile updated", data: u });
  } catch (err) {
    next(err);
  }
};
