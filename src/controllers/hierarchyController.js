const { serializeUser, findAllUsersWithRelations } = require("../services/userService");

const pickUser = (user) => ({
  _id: user.id,
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  role: user.role,
  designation: user?.professional?.designation || "",
  teamName: user?.professional?.teamName || "",
  department: user?.professional?.department || "",
  reportingManager: user?.professional?.reportingManager || "",
  profileImageUrl: user.profileImageUrl || "",
});

const designationValue = (user) => String(user?.professional?.designation || "").toLowerCase();

const isCEO = (user) => designationValue(user).includes("ceo") || user.role === "admin";
const isHRManager = (user) =>
  designationValue(user).includes("hr") && designationValue(user).includes("manager");
const isManager = (user) =>
  designationValue(user).includes("manager") &&
  !designationValue(user).includes("hr") &&
  !designationValue(user).includes("ceo");

const hierarchyOverview = async (req, res) => {
  try {
    const users = (await findAllUsersWithRelations({ order: [["name", "ASC"]] })).map((user) => serializeUser(user));

    const ceo = users.find(isCEO) || null;
    const hrManager = users.find(isHRManager) || null;
    const managers = users.filter((user) => user.role === "manager" || isManager(user));
    const employees = users.filter((user) => user.role === "employee");

    const teamsMap = new Map();
    for (const employee of employees) {
      const teamName = employee?.professional?.teamName || employee?.professional?.department || "Unassigned";
      if (!teamsMap.has(teamName)) teamsMap.set(teamName, []);
      teamsMap.get(teamName).push(pickUser(employee));
    }

    const managerByTeamName = new Map();
    managers.forEach((manager) => {
      const teamKey = String(manager?.professional?.teamName || manager?.professional?.department || "")
        .trim()
        .toLowerCase();
      if (teamKey && !managerByTeamName.has(teamKey)) {
        managerByTeamName.set(teamKey, manager.name);
      }
    });

    const teams = Array.from(teamsMap.entries())
      .map(([teamName, members]) => {
        const teamKey = String(teamName || "")
          .trim()
          .toLowerCase();

        return {
          teamName,
          members,
          membersCount: members.length,
          managedBy: managerByTeamName.get(teamKey) || "",
        };
      })
      .sort((left, right) => left.teamName.localeCompare(right.teamName));

    const hierarchyLevels =
      1 +
      (hrManager ? 1 : 0) +
      (managers.length > 0 ? 1 : 0) +
      (employees.length > 0 ? 1 : 0);

    const managementIds = new Set();
    managers.forEach((user) => managementIds.add(user.id));
    if (ceo?.id) managementIds.add(ceo.id);
    if (hrManager?.id) managementIds.add(hrManager.id);

    const summary = {
      totalEmployees: employees.length,
      management: managementIds.size,
      teams: teams.length,
      hierarchyLevels,
    };

    if (req.user?.role === "employee") {
      return res.json({
        view: "employee_full",
        cards: {
          ceo: ceo ? pickUser(ceo) : null,
          hrManager: hrManager ? pickUser(hrManager) : null,
          managers: managers.map(pickUser),
        },
        teams,
        summary,
      });
    }

    return res.json({
      view: "management",
      cards: null,
      teams,
      summary,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { hierarchyOverview };
