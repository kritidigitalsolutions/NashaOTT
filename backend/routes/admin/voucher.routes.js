const express = require("express");
const router = express.Router();

const {
  createVoucher,
  getVouchers,
  updateVoucher,
  deleteVoucher
} = require("../../controllers/admin/voucher.controller");

const { isAdmin, hasPermission } = require("../../middlewares/admin.middleware");

router.post("/", isAdmin, hasPermission("promo"), createVoucher);
router.get("/", isAdmin, hasPermission("promo"), getVouchers);
router.put("/:id", isAdmin, hasPermission("promo"), updateVoucher);
router.delete("/:id", isAdmin, hasPermission("promo"), deleteVoucher);

module.exports = router;