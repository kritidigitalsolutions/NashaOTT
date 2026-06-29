const Admin = require("../../models/admin.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AdminOtp = require("../../models/admin.otp.model");
const sendEmail = require("../../utils/sendEmail");

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({
      email: email.toLowerCase()
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }


    const isMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }

   const token = jwt.sign(
  {
    id: admin._id
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "8h"
  }
);

    res.json({
      success: true,
      message: "Login successful",
      token,
     admin: {
  _id: admin._id,
  name: admin.name,
  email: admin.email
}
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
/* FORGOT PASSWORD - SEND OTP */
exports.sendForgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const admin = await Admin.findOne({
      email: normalizedEmail
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Email not found"
      });
    }

    const otp = generateOtp();

    await AdminOtp.deleteMany({
      email: normalizedEmail,
      purpose: "forgot-password"
    });

    await AdminOtp.create({
      email: normalizedEmail,
      otp,
      purpose: "forgot-password",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    await sendEmail({
      to: normalizedEmail,
      subject: "Forgot Password OTP",
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
      html: `<h3>Your OTP is ${otp}</h3><p>Valid for 5 minutes.</p>`
    });

    res.json({
      success: true,
      message: "OTP sent successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* FORGOT PASSWORD - VERIFY OTP */
exports.verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required"
      });
    }

    const record = await AdminOtp.findOne({
      email: normalizedEmail,
      otp,
      purpose: "forgot-password",
      expiresAt: { $gt: new Date() }
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    res.json({
      success: true,
      message: "OTP verified successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* FORGOT PASSWORD - RESET */
exports.resetForgotPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and password are required"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    const record = await AdminOtp.findOne({
      email: normalizedEmail,
      otp,
      purpose: "forgot-password",
      expiresAt: { $gt: new Date() }
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    const admin = await Admin.findOne({
      email: normalizedEmail
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    await AdminOtp.deleteMany({
      email: normalizedEmail,
      purpose: "forgot-password"
    });

    res.json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select("-password -__v");
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }
    res.json({
      success: true,
      admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
