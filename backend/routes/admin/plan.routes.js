const express = require("express");
const router = express.Router();

const {
  createPlan,
  updatePlan,
  deletePlan,
  getAllPlans
} = require("../../controllers/admin/plan.controller");


const { isAdmin, hasPermission } = require("../../middlewares/admin.middleware");

// ================= ADMIN PLAN ROUTES =================

router.post("/", isAdmin, hasPermission("plans"), createPlan);
router.get("/", isAdmin, hasPermission("plans"), getAllPlans);
router.patch("/:id", isAdmin, hasPermission("plans"), updatePlan);
router.delete("/:id", isAdmin, hasPermission("plans"), deletePlan);

module.exports = router;