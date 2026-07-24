const express = require("express");
const router = express.Router();

const {
  createPromo,
  getPromos,
  deletePromo,
  updatePromo
} = require("../../controllers/admin/promo.controller");


const { isAdmin, hasPermission } = require("../../middlewares/admin.middleware");

// 🔐 ADMIN ONLY
router.post("/", isAdmin, hasPermission("promo"), createPromo);
router.get("/", isAdmin, hasPermission("promo"), getPromos);
router.delete("/:id", isAdmin, hasPermission("promo"), deletePromo);
router.put("/:id", isAdmin, hasPermission("promo"), updatePromo);

module.exports = router;