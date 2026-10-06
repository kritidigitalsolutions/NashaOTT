const Notification = require("../../models/notification.model");
const User = require("../../models/user.model");
const Subscription = require("../../models/subscription.model");
const Movie = require("../../models/movie.model");
const Series = require("../../models/series.model");
const Plan = require("../../models/plan.model");
const { sendPushNotification, sendMulticastNotification } = require("../../utils/fcm.service");

// ── Admin-level "read" tracking uses a separate readByAdmin flag ──────────

exports.sendNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      sendTo,
      targetUser,
      imageUrl,
      // Attachment fields
      attachmentType, // "none" | "content" | "plan"
      contentId,
      contentType,   // "movie" | "series"
      planId
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required"
      });
    }

    let resolvedImageUrl = (imageUrl && String(imageUrl).trim()) ? String(imageUrl).trim() : null;

    // Build metadata
    const metadata = {
      attachmentType: attachmentType || (planId ? "plan" : (contentId ? "content" : "none"))
    };

    const validContentTypes = ["movie", "series", "shortdrama"];

    if (contentType === "plan" && contentId && !planId) {
      planId = contentId;
    }

    if (contentId && contentType && validContentTypes.includes(contentType)) {
      metadata.contentId = contentId;
      metadata.contentType = contentType;

      // Auto-build action URL for mobile deep-link
      metadata.actionUrl = `bichooapp://${contentType}/id/${contentId}`;

      // Auto-fetch content poster if no explicit imageUrl was provided
      if (!resolvedImageUrl) {
        let Model;
        if (contentType === "movie") Model = Movie;
        else if (contentType === "series") Model = Series;
        else if (contentType === "shortdrama") {
          try { Model = require("../../models/shortdrama.model"); } catch (e) {}
        }

        if (Model) {
          const contentDoc = await Model.findById(contentId).select("poster banner thumbnail").lean();
          if (contentDoc) {
            resolvedImageUrl = contentDoc.poster || contentDoc.banner || contentDoc.thumbnail || null;
            console.log("[Notification] Auto-resolved image from content:", resolvedImageUrl);
          }
        }
      }
    }

    if (planId) {
      metadata.planId = planId;
      if (!metadata.actionUrl) {
        metadata.actionUrl = `bichooapp://plan/id/${planId}`;
      }
    }

    const payload = {
      title,
      message,
      type: type || "GENERAL",
      imageUrl: resolvedImageUrl || null,
      metadata,
      createdBy: req.user.id,
      sentAt: new Date()
    };

    if (sendTo === "SPECIFIC_USER") {
      payload.targetUser = targetUser;
      payload.targetUserType = null;

      const targetUserDoc = await User.findById(targetUser).select("fcmToken name email phone");
      if (!targetUserDoc) {
        return res.status(404).json({
          success: false,
          message: "Selected user not found"
        });
      }

      const notification = await Notification.create(payload);

      let pushSent = false;
      let pushMessage = "";

      if (targetUserDoc.fcmToken && String(targetUserDoc.fcmToken).trim().length > 0) {
        const pushResult = await sendPushNotification({
          token: targetUserDoc.fcmToken.trim(),
          title,
          body: message,
          imageUrl: resolvedImageUrl || null,
          actionUrl: metadata.actionUrl || null,
          data: {
            notificationId: notification._id.toString(),
            type: type || "GENERAL",
            actionUrl: metadata.actionUrl || "",
            link: metadata.actionUrl || "",
            imageUrl: resolvedImageUrl || "",
            image: resolvedImageUrl || "",
            poster: resolvedImageUrl || "",
            ...(metadata.contentId && { contentId: metadata.contentId.toString(), contentType: metadata.contentType || "" }),
            ...(metadata.planId && { planId: metadata.planId.toString() })
          }
        });
        pushSent = pushResult.success;
        pushMessage = pushResult.success ? "Push notification delivered" : `Push notification failed: ${pushResult.error}`;
      } else {
        pushMessage = "User has no active device FCM token registered (saved to user notifications only)";
      }

      return res.status(201).json({
        success: true,
        message: pushSent ? "Notification sent successfully" : `Notification saved: ${pushMessage}`,
        data: notification,
        pushReport: {
          totalUsers: 1,
          sent: pushSent ? 1 : 0,
          failed: pushSent ? 0 : 1
        }
      });
    }

    // Broadcast targets: SUBSCRIBERS or ALL
    if (sendTo === "SUBSCRIBERS") {
      payload.targetUser = null;
      payload.targetUserType = "SUBSCRIBERS";
    } else {
      payload.targetUser = null;
      payload.targetUserType = "ALL";
    }

    const notification = await Notification.create(payload);

    // 1. Respond to Admin immediately to prevent UI hanging or request timeouts
    res.status(201).json({
      success: true,
      message: "Notification sent and broadcast queued in background",
      data: notification
    });

    // 2. Dispatch push notifications in the background using batch multicast
    setImmediate(async () => {
      try {
        let userFilter = { fcmToken: { $type: "string", $ne: "" } };

        if (sendTo === "SUBSCRIBERS") {
          const subscribedUserIds = await Subscription.distinct("user", {
            status: "active",
            endDate: { $gte: new Date() }
          });
          userFilter._id = { $in: subscribedUserIds };
        }

        const usersWithToken = await User.find(userFilter).select("fcmToken").lean();
        const tokens = [
          ...new Set(
            usersWithToken
              .map((u) => u.fcmToken)
              .filter((t) => t && typeof t === "string" && t.trim().length > 0)
          ),
        ];

        console.log(`[Notification Broadcast] Sending to ${tokens.length} devices in background...`);

        await sendMulticastNotification({
          tokens,
          title,
          body: message,
          imageUrl: resolvedImageUrl || null,
          actionUrl: metadata.actionUrl || null,
          data: {
            notificationId: notification._id.toString(),
            type: type || "GENERAL",
            actionUrl: metadata.actionUrl || "",
            link: metadata.actionUrl || "",
            imageUrl: resolvedImageUrl || "",
            image: resolvedImageUrl || "",
            poster: resolvedImageUrl || "",
            ...(metadata.contentId && { contentId: metadata.contentId.toString(), contentType: metadata.contentType || "" }),
            ...(metadata.planId && { planId: metadata.planId.toString() })
          }
        });
      } catch (bgError) {
        console.error("[Notification Broadcast Background Error]:", bgError.message);
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const filter = { isActive: true };

    const [data, totalCount] = await Promise.all([
      Notification.find(filter)
        .populate("targetUser", "name email phone")
        .populate("metadata.planId", "name price duration")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    // Manually populate metadata.contentId because it has no fixed ref
    // (it can point to Movie, Series, or ShortDrama depending on contentType)
    const Movie      = require("../../models/movie.model");
    const Series     = require("../../models/series.model");
    const ShortDrama = require("../../models/shortdrama.model");

    const modelMap = {
      movie:      Movie,
      series:     Series,
      shortdrama: ShortDrama,
    };

    for (const notif of data) {
      const meta = notif.metadata;
      if (meta?.contentId && meta?.contentType) {
        const Model = modelMap[meta.contentType];
        if (Model) {
          const doc = await Model
            .findById(meta.contentId)
            .select("title poster")
            .lean();
          meta.contentId = doc || meta.contentId;
        }
      }
      // Determine read state from admin's perspective without overwriting end-user read state
      const isAdminRead = notif.readBy && notif.readBy.some(r => r.user && r.user.toString() === req.user.id);
      notif.isRead = Boolean(isAdminRead || (notif.isRead && !notif.targetUser));
    }

    res.status(200).json({
      success: true,
      data,
      pagination: {
        currentPage: page,
        totalPages:  Math.ceil(totalCount / limit),
        totalCount,
        limit,
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { returnDocument: 'after' }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification archived successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ── Mark a single notification as read (adds admin to readBy) ─────────────
exports.markAsRead = async (req, res) => {
  try {
    const existing = await Notification.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    const updateFields = {
      $addToSet: {
        readBy: { user: req.user.id, readAt: new Date() }
      }
    };

    // If it's a broadcast notification, we can set readAt, but do NOT overwrite isRead for a single targetUser
    if (!existing.targetUser) {
      updateFields.isRead = true;
      updateFields.readAt = new Date();
    }

    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { returnDocument: 'after' }
    );

    res.status(200).json({ success: true, data: notif });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Count unread notifications for admin ────────────────────────────────────
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      isActive: true,
      "readBy.user": { $ne: req.user.id }
    });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Search content (movies / series) for attachment picker ────────────────
exports.searchContent = async (req, res) => {
  try {
    const { q = "", type = "movie" } = req.query;
    const regex = new RegExp(q, "i");

    let results = [];

    if (type === "movie") {
      results = await Movie.find({ title: regex })
        .select("_id title poster")
        .limit(20)
        .lean();
    } else if (type === "series") {
      results = await Series.find({ title: regex })
        .select("_id title poster")
        .limit(20)
        .lean();
    }

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Search plans for attachment picker ────────────────────────────────────
exports.searchPlans = async (req, res) => {
  try {
    const { q = "" } = req.query;
    const regex = new RegExp(q, "i");

    const results = await Plan.find({ name: regex, isActive: true })
      .select("_id name price duration")
      .limit(20)
      .lean();

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
