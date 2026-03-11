const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.MYSQLDATABASE,
  process.env.MYSQLUSER,
  process.env.MYSQLPASSWORD,
  {
    host: process.env.MYSQLHOST || "localhost",
    port: Number(process.env.MYSQLPORT || 3306),
    dialect: "mysql",
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    timezone: "+05:30",
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("MySQL connected successfully ✅");

    const {
      ensureNormalizedUserSchema,
      seedRoles,
      backfillNormalizedUserData,
    } = require("../services/userService");
    await ensureNormalizedUserSchema();
    await seedRoles();
    await backfillNormalizedUserData();
    console.log("MySQL tables synced ✅");
  } catch (error) {
    console.error("MySQL connection failed ❌", error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
