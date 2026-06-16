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
      console.log(`✅ Default admin already exists: ${email}`);
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
        "Admin",
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