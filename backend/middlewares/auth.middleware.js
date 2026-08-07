const jwt = require("jsonwebtoken");

const isAuth = async (
  req,
  res,
  next
) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith(
        "Bearer "
      )
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const token =
      authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (decoded.role !== "USER") {
      return res.status(403).json({
        success: false,
        message: "User access only",
      });
    }

    const User = require("../models/user.model");
    const user = await User.findById(decoded.id || decoded._id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
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

    req.user = decoded;

    next();

  } catch (error) {
    console.error(
      "Auth Middleware Error:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired token",
    });
  }
};

module.exports = { isAuth };