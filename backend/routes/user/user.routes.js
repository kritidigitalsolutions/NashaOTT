const express = require("express");

const router = express.Router();

const {
  isAuth,
} = require("../../middlewares/auth.middleware");

const upload = require("../../middlewares/upload.middleware");

const {
  getProfile,
  completeProfile,
  updateProfile,
  saveFcmToken,
} = require("../../controllers/user.controller");

// Multer error-catching wrapper
const handleUpload = (req, res, next) => {
  upload.single("profileImage")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "File upload failed",
      });
    }
    next();
  });
};


// ========================================
// GET USER PROFILE
// ========================================
router.get(
  "/",
  isAuth,
  getProfile
);

router.get(
  "/profile",
  isAuth,
  getProfile
);


// ========================================
// COMPLETE PROFILE
// ========================================
router.post(
  "/complete-profile",
  isAuth,
  handleUpload,
  completeProfile
);


// ========================================
// UPDATE PROFILE
// ========================================
router.patch(
  "/update-profile",
  isAuth,
  handleUpload,
  updateProfile
);

// ========================================
// CONNECT FCM TOKEN TO USER
// ========================================
router.patch(
  "/fcm-token",
  isAuth,
  saveFcmToken
);


module.exports = router;
