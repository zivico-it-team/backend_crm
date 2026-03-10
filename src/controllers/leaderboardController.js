const LeaderboardPerformance = require("../models/LeaderboardPerformance");
const {
  serializeUser,
  findOneUserWithRelations,
  findAllUsersWithRelations,
} = require("../services/userService");

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toNonNegativeInt = (value, fallback = 0) => Math.max(0, Math.trunc(toNumber(value, fallback)));

const getProgress = (achieved, target) => {
  if (!target) return 0;
  return Math.round((achieved / target) * 100);
};

const toLeaderboardItem = (employee, performance = {}) => ({
  employeeId: employee.id,
  _id: employee.id,
  id: employee.id,
  name: employee.name || "Employee",
  email: employee.email || "",
  employeeCode: employee?.professional?.employeeId || "",
  designation: employee?.professional?.designation || "",
  target: toNonNegativeInt(performance.target, 0),
  achieved: toNonNegativeInt(performance.achieved, 0),
  progress: getProgress(toNonNegativeInt(performance.achieved, 0), toNonNegativeInt(performance.target, 0)),
  updatedBy: performance.updatedBy || "",
  updatedAt: performance.updatedAt || null,
});

const listLeaderboard = async (_req, res) => {
  try {
    const [employees, performances] = await Promise.all([
      findAllUsersWithRelations({
        roleNames: "employee",
        order: [["name", "ASC"]],
      }),
      LeaderboardPerformance.findAll({
        order: [["updatedAt", "DESC"]],
      }),
    ]);

    const perfMap = new Map(performances.map((perf) => [String(perf.employeeId), perf.toJSON()]));

    const ranked = employees
      .map((employee) => toLeaderboardItem(serializeUser(employee), perfMap.get(String(employee.id)) || {}))
      .sort((left, right) => {
        if (right.progress !== left.progress) return right.progress - left.progress;
        if (right.achieved !== left.achieved) return right.achieved - left.achieved;
        return String(left.name || "").localeCompare(String(right.name || ""));
      })
      .map((item, index) => ({ ...item, position: index + 1 }));

    const totalTarget = ranked.reduce((sum, item) => sum + item.target, 0);
    const totalAchieved = ranked.reduce((sum, item) => sum + item.achieved, 0);
    const percentage = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;

    return res.json({
      items: ranked,
      summary: {
        totalTarget,
        totalAchieved,
        percentage,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to load leaderboard data" });
  }
};

const updatePerformance = async (req, res) => {
  try {
    const employeeId = String(req.body?.employeeId || "").trim();
    const hasTarget = req.body?.target !== undefined;
    const hasAchieved = req.body?.achieved !== undefined;

    if (!employeeId) {
      return res.status(400).json({ message: "employeeId is required" });
    }

    if (!hasTarget && !hasAchieved) {
      return res.status(400).json({ message: "target or achieved value is required" });
    }

    const employeeRecord = await findOneUserWithRelations({
      where: { id: employeeId },
      roleNames: "employee",
    });

    if (!employeeRecord) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const [performance] = await LeaderboardPerformance.findOrCreate({
      where: { employeeId },
      defaults: {
        employeeId,
        target: 0,
        achieved: 0,
        updatedBy:
          req.body?.updatedBy ||
          req.user?.name ||
          req.user?.userName ||
          req.user?.email ||
          "System",
      },
    });

    if (hasTarget) {
      performance.target = toNonNegativeInt(req.body.target, performance.target);
    }

    if (hasAchieved) {
      performance.achieved = toNonNegativeInt(req.body.achieved, performance.achieved);
    }

    performance.updatedBy =
      String(req.body?.updatedBy || req.user?.name || req.user?.userName || req.user?.email || "System").trim() ||
      "System";

    await performance.save();

    return res.json({
      item: toLeaderboardItem(serializeUser(employeeRecord), performance.toJSON()),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to update leaderboard data" });
  }
};

module.exports = {
  listLeaderboard,
  updatePerformance,
};
