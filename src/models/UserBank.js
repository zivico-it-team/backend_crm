const { DataTypes } = require("sequelize");

const { sequelize } = require("../config/db");
const User = require("./User");

const UserBank = sequelize.define(
  "UserBank",
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
    bankName: { type: DataTypes.STRING(120), allowNull: true, defaultValue: "" },
    accountHolder: { type: DataTypes.STRING(120), allowNull: true, defaultValue: "" },
    accountNumberMasked: { type: DataTypes.STRING(60), allowNull: true, defaultValue: "" },
    accountNumber: { type: DataTypes.STRING(60), allowNull: true, defaultValue: "" },
    branch: { type: DataTypes.STRING(120), allowNull: true, defaultValue: "" },
    ifscCode: { type: DataTypes.STRING(60), allowNull: true, defaultValue: "" },
  },
  {
    tableName: "user_banks",
    timestamps: true,
    indexes: [{ unique: true, fields: ["userId"] }],
  }
);

UserBank.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasOne(UserBank, { foreignKey: "userId", as: "bankInfo" });

module.exports = UserBank;
