const { Op } = require("sequelize");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const {
  serializeUser,
  findAllUsersWithRelations,
  countUsersWithRole,
} = require("../services/userService");

const getDateKey = (d = new Date()) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const teamStats = async (req, res) => {
  try {
    const today = new Date();
    const dateKey = getDateKey(today);

    const totalMembers = await countUsersWithRole("employee");

    const activeAttendances = await Attendance.findAll({
      where: {
        dateKey,
        checkInAt: { [Op.ne]: null },
        checkOutAt: null,
      },
      attributes: ["userId"],
    });
    const activeIds = [...new Set(activeAttendances.map((a) => a.userId))];

    const activeNow = activeIds.length
      ? await countUsersWithRole("employee", { id: { [Op.in]: activeIds } })
      : 0;

    const onLeaveLeaves = await Leave.findAll({
      where: {
        status: "approved",
        fromDate: { [Op.lte]: today },
        toDate: { [Op.gte]: today },
      },
      attributes: ["userId"],
    });
    const onLeaveIds = [...new Set(onLeaveLeaves.map((l) => l.userId))];

    const onLeave = onLeaveIds.length
      ? await countUsersWithRole("employee", { id: { [Op.in]: onLeaveIds } })
      : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const employees = await findAllUsersWithRelations({ roleNames: "employee" });
    const newJoiners = employees
      .map((user) => serializeUser(user))
      .filter((user) => {
        const joiningDate = user.professional?.joiningDate ? new Date(user.professional.joiningDate) : null;
        return joiningDate && !Number.isNaN(joiningDate.getTime()) && joiningDate >= thirtyDaysAgo;
      }).length;

    res.json({ totalMembers, activeNow, onLeave, newJoiners });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const teamMembers = async (req, res) => {
  try {
    const {
      status = "all",
      search = "",
      team = "",
      page = 1,
      limit = 12,
      sort = "new",
    } = req.query;

    const today = new Date();
    const dateKey = getDateKey(today);

    const p = Math.max(1, Number(page));
    const l = Math.min(100, Math.max(1, Number(limit)));

    const allEmployees = await findAllUsersWithRelations({ roleNames: "employee" });
    let list = allEmployees.map((user) => serializeUser(user));

    if (team) {
      list = list.filter((user) => {
        const teamName = user?.professional?.teamName || "";
        const department = user?.professional?.department || "";
        return teamName === team || department === team;
      });
    }

    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      list = list.filter((user) => {
        const professional = user.professional || {};
        const blob = `${user.name} ${user.email} ${user.userName} ${professional.designation || ""} ${
          professional.employeeId || ""
        } ${professional.workLocation || ""}`.toLowerCase();

        return blob.includes(needle);
      });
    }

    if (status === "active") {
      const activeAttendances = await Attendance.findAll({
        where: {
          dateKey,
          checkInAt: { [Op.ne]: null },
          checkOutAt: null,
        },
        attributes: ["userId"],
      });
      const activeIds = new Set(activeAttendances.map((attendance) => attendance.userId));
      list = list.filter((user) => activeIds.has(user.id));
    }

    if (status === "onLeave") {
      const onLeaveLeaves = await Leave.findAll({
        where: {
          status: "approved",
          fromDate: { [Op.lte]: today },
          toDate: { [Op.gte]: today },
        },
        attributes: ["userId"],
      });
      const onLeaveIds = new Set(onLeaveLeaves.map((leave) => leave.userId));
      list = list.filter((user) => onLeaveIds.has(user.id));
    }

    if (status === "remote") {
      list = list.filter((user) =>
        String(user?.professional?.workLocation || "").toLowerCase().includes("remote")
      );
    }

    if (sort === "name") {
      list.sort((left, right) => String(left.name).localeCompare(String(right.name)));
    } else if (sort === "join") {
      list.sort((left, right) => {
        const leftDate = left.professional?.joiningDate ? new Date(left.professional.joiningDate).getTime() : 0;
        const rightDate = right.professional?.joiningDate ? new Date(right.professional.joiningDate).getTime() : 0;
        return rightDate - leftDate;
      });
    } else {
      list.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
    }

    const total = list.length;
    const start = (p - 1) * l;
    const members = list.slice(start, start + l);

    res.json({ page: p, limit: l, total, members });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const managersList = async (req, res) => {
  try {
    const managers = await findAllUsersWithRelations({
      roleNames: "manager",
      order: [["name", "ASC"]],
    });

    res.json(
      managers.map((manager) => {
        const user = serializeUser(manager);
        return {
          id: user.id,
          _id: user.id,
          name: user.name,
          email: user.email,
          userName: user.userName,
        };
      })
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const teamsList = async (req, res) => {
  try {
    const employees = await findAllUsersWithRelations({ roleNames: "employee" });
    const teamNames = new Set();

    for (const employee of employees.map((user) => serializeUser(user))) {
      if (employee.professional?.teamName) teamNames.add(employee.professional.teamName);
      if (employee.professional?.department) teamNames.add(employee.professional.department);
    }

    res.json([...teamNames]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { teamStats, teamMembers, managersList, teamsList };
