const { DataTypes } = require("sequelize");

const { sequelize } = require("../config/db");
const User = require("./User");

const Role = sequelize.define(
  "Role",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: "",
    },
  },
  {
    tableName: "roles",
    timestamps: true,
    indexes: [{ unique: true, fields: ["name"] }],
  }
);

Role.hasMany(User, { foreignKey: "roleId", as: "users" });
User.belongsTo(Role, { foreignKey: "roleId", as: "roleInfo" });

module.exports = Role;
