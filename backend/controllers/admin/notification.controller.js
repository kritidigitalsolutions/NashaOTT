const Notification = require("../../models/notification.model");
const User = require("../../models/user.model");
const Subscription = require("../../models/subscription.model");
const Movie = require("../../models/movie.model");
const Series = require("../../models/series.model");
const Plan = require("../../models/plan.model");
const { sendPushNotification } = require("../../utils/fcm.service");

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
    const metadata = {};

    // Resolve content metadata whenever contentId & contentType are present,
    // regardless of attachmentType (the admin panel sometimes sends
    // attachmentType:"none" even when a content item is selected).
    if (contentId && contentType) {
      metadata.contentId = contentId;
      metadata.contentType = contentType;

      // Auto-build action URL for mobile deep-link
      metadata.actionUrl = `nashaapp://${contentType}/id/${contentId}`;

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
        metadata.actionUrl = `nashaapp://plan/id/${planId}`;
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

    let users = [];

    if (sendTo === "SPECIFIC_USER") {
      payload.targetUser = targetUser;

      users = await User.find({
        _id: targetUser,
        fcmToken: { $type: "string", $ne: "" }
      });

    } else if (sendTo === "SUBSCRIBERS") {
      payload.targetUser = null;
      payload.targetUserType = "SUBSCRIBERS";

      const subscribedUserIds = await Subscription.distinct("user", {
        status: "active",
        endDate: { $gte: new Date() }
      });

      users = await User.find({
        _id: { $in: subscribedUserIds },
        fcmToken: { $type: "string", $ne: "" }
      });

    } else {
      payload.targetUser = null;
      payload.targetUserType = "ALL";

      users = await User.find({
        fcmToken: { $type: "string", $ne: "" }
      });
    }

    const notification = await Notification.create(payload);

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      const result = await sendPushNotification({
        token: user.fcmToken,
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

      console.log("Push to:", user._id, result);

      if (result.success) sent++;
      else failed++;
    }

    res.status(201).json({
      success: true,
      message: "Notification sent successfully",
      data: notification,
      pushReport: {
        totalUsers: users.length,
        sent,
        failed
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
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      {
        isRead: true,
        readAt: new Date(),
        $addToSet: {
          readBy: { user: req.user.id, readAt: new Date() }
        }
      },
      { returnDocument: 'after' }
    );

    if (!notif) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({ success: true, data: notif });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Count unread notifications (isRead: false) ────────────────────────────
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ isRead: false, isActive: true });
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
