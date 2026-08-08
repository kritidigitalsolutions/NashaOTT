const jwt = require("jsonwebtoken");

const OTP = require("../models/user.otp.model");
const User = require("../models/user.model");
const { sendOtpSms } = require("../utils/smsGh.service");

const { admin } = require("../config/firebase");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// ========================================
// FORMAT INDIAN PHONE
// ========================================
const formatIndianPhone = (phone) => {
  const cleaned = String(phone).replace(
    /\D/g,
    ""
  );

  if (cleaned.length === 10) {
    return "+91" + cleaned;
  }

  if (
    cleaned.length === 12 &&
    cleaned.startsWith("91")
  ) {
    return "+" + cleaned;
  }

  return phone;
};


// ========================================
// GENERATE USER TOKEN
// ========================================
const generateUserToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRE || "7d",
    }
  );
};


// ========================================
// SEND OTP
// ========================================
exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone is required",
      });
    }

    const normalizedPhone =
      formatIndianPhone(phone);

    // indian mobile validation
    const phoneRegex =
      /^\+91[6-9]\d{9}$/;

    if (
      !phoneRegex.test(normalizedPhone)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter valid Indian mobile number",
      });
    }

    const user = await User.findOne({ phone: normalizedPhone });
    if (user && user.isBlocked) {
      return res.status(200).json({
        success: true,
        message: "Your account has been blocked. Please contact support.",
        user: {
          _id: user._id,
          name: user.name,
          authProvider: user.authProvider,
          phone: user.phone,
          profileImage: user.profileImage,
          profileComplete: user.profileComplete,
          fcmToken: user.fcmToken,
          fcmTokenUpdatedAt: user.fcmTokenUpdatedAt,
          role: user.role,
          lastLoginAt: user.lastLoginAt,
          isBlocked: true,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }
      });
    }

    // rate limit
    let recentOtp = null;
    if (normalizedPhone !== "+919999999999") {
      recentOtp = await OTP.findOne({
        phone: normalizedPhone,
        createdAt: {
          $gt: new Date(
            Date.now() - 60 * 1000
          ),
        },
      });
    }

    if (recentOtp) {
      return res.status(429).json({
        success: false,
        message:
          "Please wait before requesting another OTP",
      });
    }

    // generate otp
    let otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    if (normalizedPhone === "+919999999999") {
      otp = "123456";
    }

    // check if user exists (already fetched above)
    const isNewUser =
      !user || !user.profileComplete;

    // console otp
    console.log(
      `📱 OTP for ${normalizedPhone}: ${otp} | isNewUser: ${isNewUser}`
    );

    if (normalizedPhone !== "+919999999999") {
      await sendOtpSms({
        phone: normalizedPhone,
        otp,
      });
    } else {
      console.log(`📱 Bypassing SMS for dummy phone ${normalizedPhone}. Defaulting OTP to ${otp}.`);
    }

    // remove old otp
    await OTP.deleteMany({
      phone: normalizedPhone,
    });

    // save new otp
    await OTP.create({
      phone: normalizedPhone,
      otp,
      expiresAt: new Date(
        Date.now() + 5 * 60 * 1000
      ),
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      isNewUser,
      ...(normalizedPhone === "+919999999999" && { otp }),
    });

  } catch (error) {
    console.error(
      "SEND OTP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};


// ========================================
// VERIFY OTP
// ========================================
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message:
          "Phone and OTP are required",
      });
    }

    const normalizedPhone =
      formatIndianPhone(phone);

    const normalizedOtp = String(
      otp
    ).trim();

    let otpRecord;
    if (normalizedPhone === "+919999999999" && normalizedOtp === "123456") {
      otpRecord = { phone: normalizedPhone, otp: "123456" };
    } else {
      otpRecord =
        await OTP.findOne({
          phone: normalizedPhone,
          otp: normalizedOtp,
          expiresAt: {
            $gt: new Date(),
          },
        }).sort({
          createdAt: -1,
        });
    }

    // wrong otp
    if (!otpRecord) {
      const existing =
        await OTP.findOne({
          phone: normalizedPhone,
          expiresAt: {
            $gt: new Date(),
          },
        });

      if (existing) {
        existing.attempts =
          (existing.attempts || 0) + 1;

        await existing.save();

        if (existing.attempts >= 5) {
          await OTP.deleteOne({
            _id: existing._id,
          });

          return res.status(429).json({
            success: false,
            message:
              "Too many wrong attempts. Request new OTP.",
          });
        }
      }

      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired OTP",
      });
    }

    // delete otp after success
    if (otpRecord._id) {
      await OTP.deleteOne({
        _id: otpRecord._id,
      });
    }

    // check user
    let user = await User.findOne({
      phone: normalizedPhone,
    });

    if (user && user.isBlocked) {
      return res.status(200).json({
        success: true,
        message: "Your account has been blocked. Please contact support.",
        user: {
          _id: user._id,
          name: user.name,
          authProvider: user.authProvider,
          phone: user.phone,
          profileImage: user.profileImage,
          profileComplete: user.profileComplete,
          fcmToken: user.fcmToken,
          fcmTokenUpdatedAt: user.fcmTokenUpdatedAt,
          role: user.role,
          lastLoginAt: user.lastLoginAt,
          isBlocked: true,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }
      });
    }

    // create user automatically
    if (!user) {
      user = await User.create({
        phone: normalizedPhone,
        role: "USER",
        ...(normalizedPhone === "+919999999999" && {
          name: "Dummy User",
          email: "",
          profileComplete: true,
        }),
      });
    } else if (normalizedPhone === "+919999999999") {
      user.name = "Dummy User";
      user.email = "";
      user.profileComplete = true;
      await user.save();
    }

    const rawFcmToken =
      req.body.fcmToken || req.body.token;

    const normalizedFcmToken =
      typeof rawFcmToken === "string"
        ? rawFcmToken.trim()
        : "";

    if (normalizedFcmToken) {
      await User.updateMany(
        {
          _id: { $ne: user._id },
          fcmToken: normalizedFcmToken,
        },
        {
          $unset: {
            fcmToken: "",
            fcmTokenUpdatedAt: "",
          },
        }
      );

      user.fcmToken = normalizedFcmToken;
      user.fcmTokenUpdatedAt = new Date();

      await user.save();
    }

    // generate token
    const token =
      generateUserToken(user);

    const isNewUser = !user.profileComplete;

    return res.status(200).json({
      success: true,
      message:
        "OTP verified successfully",

      token,
      isNewUser,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage:
          user.profileImage,
        profileComplete:
          user.profileComplete,
        role: user.role,
      },
    });

  } catch (error) {
    console.error(
      "VERIFY OTP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Verification failed",
    });
  }
};

// ========================================
// GOOGLE LOGIN
// ========================================
exports.googleLogin = async (req, res) => {
  try {
    const { idToken, token, fcmToken } = req.body;

    if (!idToken && !token) {
      return res.status(400).json({
        success: false,
        message: "Google ID token is required",
      });
    }

    let uid;
    let email;
    let name;
    let picture;

    if (idToken) {
      if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(500).json({
          success: false,
          message: "Google client ID is not configured",
        });
      }

      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      uid = payload.sub;
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    } else {
      // Backward compatibility for Firebase Auth clients.
      const decodedToken = await admin.auth().verifyIdToken(token);

      uid = decodedToken.uid;
      email = decodedToken.email;
      name = decodedToken.name;
      picture = decodedToken.picture;
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Google account email not found",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find existing user by Google UID or by Email
    let user = await User.findOne({
      $or: [
        { googleId: uid },
        { email: normalizedEmail }
      ]
    });

    if (user && user.isBlocked) {
      return res.status(200).json({
        success: true,
        message: "Your account has been blocked. Please contact support.",
        user: {
          _id: user._id,
          name: user.name,
          authProvider: user.authProvider,
          email: user.email,
          profileImage: user.profileImage,
          profileComplete: user.profileComplete,
          fcmToken: user.fcmToken,
          fcmTokenUpdatedAt: user.fcmTokenUpdatedAt,
          role: user.role,
          lastLoginAt: user.lastLoginAt,
          isBlocked: true,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }
      });
    }

    let isNewUser = false;

    // Create new user if not exists
    if (!user) {
      isNewUser = true;

      // We generate a highly unique temporary/placeholder phone string using UID and random characters
      // to guarantee uniqueness and avoid duplicate key errors on the unique phone index.
      const uniqueSuffix = Math.random().toString(36).substring(2, 8);
      const tempPhone = `google_${uid.substring(0, 10)}_${uniqueSuffix}`;

      user = await User.create({
        name: name || "User",
        email: normalizedEmail,
        profileImage: picture || "",
        googleId: uid,
        authProvider: "GOOGLE",
        profileComplete: true,
        phone: tempPhone,
      });
    } else {
      // If the user exists but hasn't linked Google credentials yet, link them!
      let updated = false;
      if (!user.googleId) {
        user.googleId = uid;
        updated = true;
      }
      if (user.authProvider !== "GOOGLE") {
        user.authProvider = "GOOGLE";
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    // Save FCM Token & disassociate it from any other users to prevent duplicate alerts
    if (fcmToken && typeof fcmToken === "string") {
      const normalizedFcmToken = fcmToken.trim();
      if (normalizedFcmToken) {
        await User.updateMany(
          {
            _id: { $ne: user._id },
            fcmToken: normalizedFcmToken,
          },
          {
            $unset: {
              fcmToken: "",
              fcmTokenUpdatedAt: "",
            },
          }
        );

        user.fcmToken = normalizedFcmToken;
        user.fcmTokenUpdatedAt = new Date();
        await user.save();
      }
    }

    // Generate JWT
    const appToken = generateUserToken(user);

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      token: appToken,
      isNewUser,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("GOOGLE LOGIN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Google login failed",
    });
  }
};


// ========================================
// WEBSITE SSO LOGIN
// ========================================
exports.websiteSSOLogin = async (req, res) => {
  try {
    let appToken = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      appToken = authHeader.split(" ")[1];
    } else if (req.body && req.body.token) {
      appToken = req.body.token;
    } else if (req.query && req.query.token) {
      appToken = req.query.token;
    }

    if (!appToken) {
      return res.status(400).json({
        success: false,
        message: "Authentication token missing",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        appToken,
        process.env.JWT_SECRET
      );
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isBlocked) {
      return res.status(200).json({
        success: true,
        message: "Your account has been blocked. Please contact support.",
        user: {
          _id: user._id,
          name: user.name,
          authProvider: user.authProvider,
          email: user.email,
          phone: user.phone,
          profileImage: user.profileImage,
          profileComplete: user.profileComplete,
          fcmToken: user.fcmToken,
          fcmTokenUpdatedAt: user.fcmTokenUpdatedAt,
          role: user.role,
          lastLoginAt: user.lastLoginAt,
          isBlocked: true,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    // Generate fresh website token
    const websiteToken = generateUserToken(user);

    return res.status(200).json({
      success: true,
      message: "Website login successful",
      token: websiteToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("WEBSITE SSO LOGIN:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};