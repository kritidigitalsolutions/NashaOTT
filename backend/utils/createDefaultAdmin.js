const bcrypt = require("bcryptjs");
const Admin = require("../models/admin.model");

const createDefaultAdmin = async () => {
  try {
    if (
      !process.env.DEFAULT_ADMIN_EMAIL ||
      !process.env.DEFAULT_ADMIN_PASSWORD
    ) {
      return;
    }

    const email =
      process.env.DEFAULT_ADMIN_EMAIL
        .trim()
        .toLowerCase();

    const existingAdmin =
      await Admin.findOne({ email });

    if (existingAdmin) {
      if (existingAdmin.name === "Nazar OTT" || existingAdmin.name === "Nasha OTT") {
        existingAdmin.name = process.env.DEFAULT_ADMIN_NAME || "Bichoo";
        await existingAdmin.save();
        console.log(`✅ Default admin name updated to: ${existingAdmin.name}`);
      } else {
        console.log(`✅ Default admin already exists: ${email}`);
      }
      return;
    }

    const hashedPassword =
      await bcrypt.hash(
        process.env.DEFAULT_ADMIN_PASSWORD,
        10
      );

    await Admin.create({
      name:
        process.env.DEFAULT_ADMIN_NAME ||
        "Bichoo",
      email,
      password: hashedPassword
    });

    console.log(
      "✅ Default Admin Created"
    );

  } catch (error) {
    console.error(
      "❌ Create Admin Error:",
      error.message
    );
  }
};

module.exports = createDefaultAdmin;