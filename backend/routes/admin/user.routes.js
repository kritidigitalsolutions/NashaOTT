const express = require("express");

const router = express.Router();

const {
    isAuth,
} = require("../../middlewares/auth.middleware");

const {
    isAdmin, hasPermission } = require("../../middlewares/admin.middleware");

const upload = require(
    "../../middlewares/upload.middleware"
);

const {
    getProfile,
    completeProfile,
    updateProfile,
} = require("../../controllers/user.controller");

const {
    getAllUsers,
    getSingleUser,
    deleteAllUsers,
    deleteUser,
    toggleBlockUser,
    getRegistrationStats,
    getUserGrowth,
} = require("../../controllers/admin/user.controller");


// ========================================
// USER ROUTES
// ========================================

// Get own profile
router.get(
    "/profile",
    isAuth,
    getProfile
);

// Complete profile
router.post(
    "/complete-profile",
    isAuth,
    upload.any(),
    completeProfile
);

// Update profile
router.patch(
    "/update-profile",
    isAuth,
    upload.any(),
    updateProfile
);


// ========================================
// ADMIN USER MANAGEMENT
// ========================================

// Get all users
router.get(
    "/",
    isAdmin, hasPermission("users"),
    getAllUsers
);

// Get user registration stats
router.get(
    "/registration-stats",
    isAdmin, hasPermission("users"),
    getRegistrationStats
);

// Get user growth stats
router.get(
    "/growth",
    isAdmin, hasPermission("users"),
    getUserGrowth
);

// Get single user
router.get(
    "/:id",
    isAdmin, hasPermission("users"),
    getSingleUser
);

// Delete all users
router.delete(
    "/delete-all",
    isAdmin, hasPermission("users"),
    deleteAllUsers
);

// Toggle block user
router.patch(
    "/:id/block",
    isAdmin, hasPermission("users"),
    toggleBlockUser
);

// Delete user
router.delete(
    "/:id",
    isAdmin, hasPermission("users"),
    deleteUser
);


module.exports = router;