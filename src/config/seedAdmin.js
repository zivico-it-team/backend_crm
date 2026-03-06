const User = require("../models/User");
const bcrypt = require("bcryptjs");

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ where: { role: "admin" } });

    if (adminExists) {
      console.log("Admin already exists 👑");
      return;
    }

    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    await User.create({
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      userName: process.env.ADMIN_USERNAME,
      password: hashedPassword,
      role: "admin",
    });

    console.log("Default admin created ✅");
  } catch (error) {
    console.error("Admin seed failed ❌", error.message);
  }
};

module.exports = seedAdmin;
