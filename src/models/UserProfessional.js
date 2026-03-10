const { DataTypes } = require("sequelize");

const { sequelize } = require("../config/db");
const User = require("./User");

const UserProfessional = sequelize.define(
  "UserProfessional",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    employeeId: { type: DataTypes.STRING(60), allowNull: true, defaultValue: "" },
    designation: { type: DataTypes.STRING(120), allowNull: true, defaultValue: "" },
    teamName: { type: DataTypes.STRING(120), allowNull: true, defaultValue: "" },
    department: { type: DataTypes.STRING(120), allowNull: true, defaultValue: "" },
    employmentType: { type: DataTypes.STRING(80), allowNull: true, defaultValue: "" },
    joiningDate: { type: DataTypes.DATE, allowNull: true },
    reportingManager: { type: DataTypes.STRING(120), allowNull: true, defaultValue: "" },
    workLocation: { type: DataTypes.STRING(120), allowNull: true, defaultValue: "" },
    leaveBalance: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
    leaveBalances: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
  },
  {
    tableName: "user_professionals",
    timestamps: true,
    indexes: [{ unique: true, fields: ["userId"] }, { fields: ["employeeId"] }],
  }
);

UserProfessional.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasOne(UserProfessional, { foreignKey: "userId", as: "professionalInfo" });

module.exports = UserProfessional;
