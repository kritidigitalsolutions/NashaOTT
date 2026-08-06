const express = require("express");
const router = express.Router();

const { isAdmin, hasPermission } = require("../../middlewares/admin.middleware");

const {
  sendNotification,
  getNotifications,
  deleteNotification,
  markAsRead,
  getUnreadCount,
  searchContent,
  searchPlans
} = require("../../controllers/admin/notification.controller");

router.use(isAdmin);

router.post("/send", sendNotification);
router.get("/unread-count", getUnreadCount);
router.get("/search-content", searchContent);
router.get("/search-plans", searchPlans);
router.get("/", getNotifications);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;