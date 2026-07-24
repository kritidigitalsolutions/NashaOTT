const express = require("express");

const router = express.Router();

const {
  getCompanyInfo,
  saveCompanyInfo,
  updateCompanyInfoStatus,
} = require("../../controllers/admin/companyInfo.controller");

const { isAdmin, hasPermission } = require("../../middlewares/admin.middleware");

// Get Company Info
router.get("/", isAdmin, hasPermission("company-info"), getCompanyInfo);

// Create / Update Company Info
router.patch("/", isAdmin, hasPermission("company-info"), saveCompanyInfo);

// Update Status
router.patch("/status", isAdmin, hasPermission("company-info"), updateCompanyInfoStatus);

module.exports = router;