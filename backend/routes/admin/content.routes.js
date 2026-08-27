const express = require("express");
const router = express.Router();
const { isAdmin, hasPermission } = require("../../middlewares/admin.middleware");
const { getContentStats, getAllContent, getPaginatedContent } = require("../../controllers/admin/content.controller");

// All content routes are admin-only
router.get("/stats", isAdmin, hasPermission("content"), getContentStats);
router.get("/all", isAdmin, hasPermission("content"), getAllContent);
router.get("/paginated", isAdmin, hasPermission("content"), getPaginatedContent);

module.exports = router;
