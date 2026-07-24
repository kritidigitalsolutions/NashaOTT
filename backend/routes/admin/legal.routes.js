const express = require("express");

const router = express.Router();

const {
  isAdmin, hasPermission } = require("../../middlewares/admin.middleware");

const {
  getLegalDocuments,
  getLegalByType,
  addOrUpdateLegalDocument,
  togglePublish
} = require("../../controllers/admin/legal.controller");


// ========================================
// ADMIN LEGAL ROUTES
// ========================================

// Get all legal docs
router.get(
  "/",
  isAdmin, hasPermission("legal"),
  getLegalDocuments
);

// Get legal doc by type
router.get(
  "/:type",
  isAdmin, hasPermission("legal"),
  getLegalByType
);

// Create/update legal doc
router.put(
  "/:type",
  isAdmin, hasPermission("legal"),
  addOrUpdateLegalDocument
);

// Toggle publish status
router.patch(
  "/:type/toggle",
  isAdmin, hasPermission("legal"),
  togglePublish
);

module.exports = router;