const User = require("../models/user.model");

const formatIndianPhone = (phone) => {
  const cleaned = String(phone).replace(/\D/g, "");

  if (cleaned.length === 10) {
    return "+91" + cleaned;
  }

  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return "+" + cleaned;
  }

  return phone;
};


// ========================================
// GET PROFILE
// ========================================
exports.getProfile = async (
  req,
  res
) => {
  try {
    const user = await User.findById(
      req.user.id
    ).select("-__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {
    console.error(
      "Get Profile Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ========================================
// COMPLETE PROFILE
// ========================================
exports.completeProfile = async (
  req,
  res
) => {
  try {
    const {
      name,
      email,
      phone,
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ================================
    // BLOCK SECOND TIME COMPLETION
    // ================================
    if (user.profileComplete) {
      return res.status(400).json({
        success: false,
        message: "Profile already completed. Use update-profile API.",
      });
    }

    const updateFields = { profileComplete: true };

    // prevent duplicate email
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const existingEmail = await User.findOne({ email: normalizedEmail });
      if (existingEmail && existingEmail._id.toString() !== user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
      updateFields.email = normalizedEmail;
    }

    // prevent duplicate phone
    if (phone) {
      const normalizedPhone = formatIndianPhone(phone);
      const existingPhone = await User.findOne({ phone: normalizedPhone });
      if (existingPhone && existingPhone._id.toString() !== user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: "Phone number already in use",
        });
      }
      updateFields.phone = normalizedPhone;
    }

    if (name) {
      updateFields.name = name;
    }

    // handle profile image
    if (req.file) {
      updateFields.profileImage = req.file.path.replace(/\\/g, "/");
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { returnDocument: 'after', runValidators: false }
    ).select("-__v");

    res.status(200).json({
      success: true,
      message: "Profile completed successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Complete Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ========================================
// UPDATE PROFILE
// ========================================
exports.updateProfile = async (
  req,
  res
) => {
  try {
    const {
      name,
      email,
      phone,
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Build the fields to update
    const updateFields = {};

    // duplicate email check
    if (email) {
      const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
      if (existingEmail && existingEmail._id.toString() !== user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
      updateFields.email = email.trim().toLowerCase();
    }

    // duplicate phone check
    if (phone) {
      const normalizedPhone = formatIndianPhone(phone);
      const existingPhone = await User.findOne({ phone: normalizedPhone });
      if (existingPhone && existingPhone._id.toString() !== user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: "Phone number already in use",
        });
      }
      updateFields.phone = normalizedPhone;
    }

    if (name) {
      updateFields.name = name;
    }

    // handle profile image
    if (req.file) {
      updateFields.profileImage = req.file.path.replace(/\\/g, "/");
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { returnDocument: 'after', runValidators: false }
    ).select("-__v");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ========================================
// SAVE FCM TOKEN
// ========================================
exports.saveFcmToken = async (req, res) => {
  try {
    const rawToken = req.body.fcmToken || req.body.token;
    const fcmToken =
      typeof rawToken === "string"
        ? rawToken.trim()
        : "";

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: "FCM token is required",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await User.updateMany(
      {
        _id: { $ne: user._id },
        fcmToken,
      },
      {
        $unset: {
          fcmToken: "",
          fcmTokenUpdatedAt: "",
        },
      }
    );

    user.fcmToken = fcmToken;
    user.fcmTokenUpdatedAt = new Date();

    await user.save();

    res.status(200).json({
      success: true,
      message: "FCM token connected to user successfully",
      userId: user._id,
      hasFcmToken: true,
    });
  } catch (error) {
    console.error("Save FCM Token Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
