const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.MYSQL_DB,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT || 3306),
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

    // Create tables if not exist (dev-friendly)
    await sequelize.sync();
    console.log("MySQL tables synced ✅");
  } catch (error) {
    console.error("MySQL connection failed ❌", error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
