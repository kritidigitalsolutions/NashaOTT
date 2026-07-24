const Notification = require("../models/notification.model");
const User = require("../models/user.model");
const { sendPushNotification } = require("./fcm.service");

/**
 * Builds an emoji prefix based on content type.
 */
const contentEmoji = {
    movie: "🎬",
    series: "📺",
    shortdrama: "🎭",
};

/**
 * Builds a human-readable label for the content type.
 */
const contentLabel = {
    movie: "Movie",
    series: "Series",
    shortdrama: "Short Drama",
};

/**
 * Sends a broadcast notification to ALL users when new content is uploaded.
 *
 * @param {Object} params
 * @param {Object} params.content      - The newly created content document (movie/series/shortdrama)
 * @param {string} params.contentType  - "movie" | "series" | "shortdrama"
 * @param {string} params.createdBy    - Admin ID (req.user.id)
 */
const sendContentUploadNotification = async ({ content, contentType, createdBy }) => {
    try {
        const emoji = contentEmoji[contentType] || "🎬";
        const label = contentLabel[contentType] || "Content";

        // ── Build title ──────────────────────────────────────────────────────
        const title = `${emoji} New ${label}: ${content.title}`;

        // ── Build message body with all relevant content info ────────────────
        const parts = [];

        if (content.description) {
            // Include a short snippet (max 100 chars)
            const snippet = content.description.length > 100
                ? content.description.slice(0, 97) + "..."
                : content.description;
            parts.push(snippet);
        }

        const infoParts = [];

        if (content.genre && content.genre.length > 0) {
            infoParts.push(`Genre: ${Array.isArray(content.genre) ? content.genre.join(", ") : content.genre}`);
        }

        if (content.language) {
            infoParts.push(`Language: ${content.language}`);
        }

        if (content.releaseYear) {
            infoParts.push(`Year: ${content.releaseYear}`);
        }

        if (content.rating && Number(content.rating) > 0) {
            infoParts.push(`⭐ Rating: ${content.rating}`);
        }

        if (content.duration) {
            infoParts.push(`Duration: ${content.duration}`);
        }

        if (infoParts.length > 0) {
            parts.push(infoParts.join(" · "));
        }

        if (content.isPremium) {
            parts.push("🔒 Premium content");
        }

        if (content.is18Plus) {
            parts.push("🔞 18+ content");
        }

        if (content.isComingSoon) {
            parts.push("🚀 Coming Soon");
        }

        const message = parts.length > 0
            ? parts.join("\n")
            : `A new ${label.toLowerCase()} is now available on Nasha!`;

        // ── Build deep link URL ───────────────────────────────────────────────
        // Reads APP_DEEP_LINK_SCHEME from .env (e.g. "nashaott://" or "https://nashaott.com")
        // Falls back to "nashaott://" if not set.
        const scheme = (process.env.APP_DEEP_LINK_SCHEME || "nashaott://").replace(/\/+$/, "");
        const actionUrl = `${scheme}/content/${contentType}/${content._id}`;

        // ── Create DB notification record (broadcast to ALL users) ───────────
        const notification = await Notification.create({
            title,
            message,
            type: "NEW_CONTENT",
            targetUser: null,
            targetUserType: "ALL",
            imageUrl: content.poster || null,
            metadata: {
                contentId: content._id,
                contentType,
                actionUrl,          // full deep link e.g. nashaott://content/movie/<id>
            },
            createdBy,
            sentAt: new Date(),
            isActive: true,
        });

        // ── Send FCM push notifications to all users with a valid token ───────
        const users = await User.find({
            fcmToken: { $type: "string", $ne: "" },
        }).select("_id fcmToken");

        // Build the rich data payload for mobile deep-linking
        const pushData = {
            notificationId: notification._id.toString(),
            type: "NEW_CONTENT",
            contentId: content._id.toString(),
            contentType,
            actionUrl,
            poster: content.poster || "",
            isPremium: String(!!content.isPremium),
            is18Plus: String(!!content.is18Plus),
            isComingSoon: String(!!content.isComingSoon),
            genre: Array.isArray(content.genre)
                ? content.genre.join(",")
                : (content.genre || ""),
            language: content.language || "",
            releaseYear: content.releaseYear ? String(content.releaseYear) : "",
            rating: content.rating ? String(content.rating) : "",
            duration: content.duration || "",
        };

        let sent = 0;
        let failed = 0;

        for (const user of users) {
            const result = await sendPushNotification({
                token: user.fcmToken,
                title,
                body: parts[0] || message, // First line as push body
                imageUrl: content.poster || null,
                actionUrl,
                data: pushData,
            });

            if (result.success) sent++;
            else failed++;
        }

        console.log(
            `[ContentUploadNotification] "${title}" → DB saved | Push: ${sent} sent, ${failed} failed`
        );

    } catch (error) {
        // Non-blocking: log the error but do NOT re-throw.
        // Content upload should succeed even if notification fails.
        console.error("[ContentUploadNotification] Error:", error.message);
    }
};

module.exports = { sendContentUploadNotification };
