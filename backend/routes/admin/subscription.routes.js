const express = require("express");
const router = express.Router();

const {
  getRevenue,
  getSubscriptionStats,
  getIncomeStats,
  getAllSubscriptions,
  cancelSubscriptionAdmin,
  syncPendingPayments,
} = require("../../controllers/admin/subscription.controller"); 
const { isAdmin, hasPermission } = require("../../middlewares/admin.middleware");

router.get("/revenue", isAdmin, hasPermission("pricing"), getRevenue);
router.get("/stats", isAdmin, hasPermission("pricing"), getSubscriptionStats);
router.get("/income-stats", isAdmin, hasPermission("pricing"), getIncomeStats);
router.get("/all", isAdmin, hasPermission("pricing"), getAllSubscriptions);
router.patch("/:id/cancel", isAdmin, hasPermission("pricing"), cancelSubscriptionAdmin);
router.post("/sync-pending", isAdmin, hasPermission("pricing"), syncPendingPayments);

module.exports = router;
