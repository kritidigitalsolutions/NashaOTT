const express = require("express");

const router = express.Router();

const {
  isAdmin, hasPermission } = require("../../middlewares/admin.middleware");

const upload = require("../../middlewares/upload.middleware");

const {
  getAllTickets,
  getAdminSingleTicket,
  adminReplyTicket,
  updateTicketStatus,
  getAdminTicketConversation,
} = require("../../controllers/admin/support.controller");


// ========================================
// GET ALL TICKETS
// ========================================
router.get(
  "/",
  isAdmin, hasPermission("support"),
  getAllTickets
);


// ========================================
// GET SINGLE TICKET
// ========================================
router.get(
  "/:id",
  isAdmin, hasPermission("support"),
  getAdminSingleTicket
);


// ========================================
// ADMIN REPLY
// ========================================
router.post(
  "/reply/:id",
  isAdmin, hasPermission("support"),
  upload.array("attachments", 5),
  adminReplyTicket
);


// ========================================
// UPDATE STATUS
// ========================================
router.patch(
  "/status/:id",
  isAdmin, hasPermission("support"),
  updateTicketStatus
);

// ========================================
// GET TICKET CONVERSATION
// ======================================== 
router.get(
  "/conversation/:id",
  isAdmin, hasPermission("support"),
  getAdminTicketConversation
);

module.exports = router;