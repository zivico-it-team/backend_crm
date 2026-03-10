const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const {
  createUserWithRelations,
  findOneUserWithRelations,
  updateUserWithRelations,
} = require("../services/userService");

const seedAdmin = async () => {
  try {
    const adminExists = await findOneUserWithRelations({ roleNames: "admin" });

    if (adminExists) {
      console.log("Admin already exists");
      return;
    }

    const configuredAdmin = await User.findOne({
      where: {
        [Op.or]: [{ email: process.env.ADMIN_EMAIL }, { userName: process.env.ADMIN_USERNAME }],
      },
    });

    if (configuredAdmin) {
      await updateUserWithRelations(configuredAdmin.id, { role: "admin" });
      console.log("Default admin role restored");
      return;
    }

    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    await createUserWithRelations({
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      userName: process.env.ADMIN_USERNAME,
      password: hashedPassword,
      role: "admin",
    });

    console.log("Default admin created");
  } catch (error) {
    console.error("Admin seed failed", error.message);
  }
};

module.exports = seedAdmin;
