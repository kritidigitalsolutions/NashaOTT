const express = require("express");
const router = express.Router();
const { isAdmin, hasPermission } = require("../../middlewares/admin.middleware");
const {
  getWebpageConfig,
  updateWebpageConfig
} = require("../../controllers/admin/webpage.controller");

// ========================================
// ADMIN WEBPAGE ROUTES (Protected)
// ========================================

// Get current webpage layout config
router.get("/", isAdmin, hasPermission("webpage"), getWebpageConfig);

// Save/update webpage layout config
router.post("/", isAdmin, hasPermission("webpage"), updateWebpageConfig);

module.exports = router;
