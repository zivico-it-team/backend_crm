const { DataTypes } = require("sequelize");

const { sequelize } = require("../config/db");
const User = require("./User");

const UserEmergencyContact = sequelize.define(
  "UserEmergencyContact",
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
    name: { type: DataTypes.STRING(120), allowNull: true, defaultValue: "" },
    phone: { type: DataTypes.STRING(30), allowNull: true, defaultValue: "" },
    relationship: { type: DataTypes.STRING(80), allowNull: true, defaultValue: "" },
    email: { type: DataTypes.STRING(120), allowNull: true, defaultValue: "" },
  },
  {
    tableName: "user_emergency_contacts",
    timestamps: true,
    indexes: [{ unique: true, fields: ["userId"] }],
  }
);

UserEmergencyContact.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasOne(UserEmergencyContact, { foreignKey: "userId", as: "emergencyContactInfo" });

module.exports = UserEmergencyContact;
