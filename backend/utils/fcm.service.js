const {
  admin,
  firebaseInitialized,
} = require("../config/firebase");

/**
 * Sends a real or mock push notification using Firebase Cloud Messaging.
 * @param {Object} params
 * @param {string} params.token - Target FCM token
 * @param {string} params.title - Notification title
 * @param {string} params.body - Notification body content
 * @param {Object} [params.data] - Optional metadata (converted to key-value strings)
 */
const sendPushNotification = async ({ token, title, body, imageUrl, actionUrl, data }) => {
  try {
    if (!token) {
      return { success: false, error: "No token provided" };
    }

    const getValidUrl = (val) => (val && typeof val === "string" && val.trim().length > 0) ? val.trim() : null;
    const finalImageUrl = getValidUrl(imageUrl) || getValidUrl(data?.imageUrl) || getValidUrl(data?.image) || getValidUrl(data?.poster) || null;
    const finalActionUrl = getValidUrl(actionUrl) || getValidUrl(data?.actionUrl) || getValidUrl(data?.link) || null;

    if (!firebaseInitialized) {
      console.log("-----------------------------------------");
      console.log("PUSH NOTIFICATION SENT (MOCK/STUB MODE)");
      console.log("To:", token);
      console.log("Title:", title);
      console.log("Body:", body);
      console.log("Image URL:", finalImageUrl);
      console.log("Action/Link URL:", finalActionUrl);
      console.log("Data:", data);
      console.log("-----------------------------------------");
      return { success: true, messageId: `mock-id-${Date.now()}` };
    }

    // Convert data fields to strings, as FCM data payload requires string values
    const stringifiedData = {};
    if (data) {
      Object.keys(data).forEach((key) => {
        stringifiedData[key] = String(data[key]);
      });
    }

    // Ensure image and link are also in data payload for mobile application handling
    if (finalImageUrl) {
      stringifiedData.imageUrl = String(finalImageUrl);
      stringifiedData.image = String(finalImageUrl);
      stringifiedData.poster = String(finalImageUrl);
    }
    if (finalActionUrl) {
      stringifiedData.actionUrl = String(finalActionUrl);
      stringifiedData.link = String(finalActionUrl);
    }

    const message = {
      token,
      notification: {
        title,
        body,
      },
      data: stringifiedData,
    };

    // Add image if available
    if (finalImageUrl) {
      message.notification.image = finalImageUrl;
    }

    // Platform-specific overrides
    // Android overrides
    if (finalImageUrl) {
      message.android = {
        notification: {
          image: finalImageUrl,
        },
      };
    }

    // iOS overrides (APNs)
    message.apns = {
      payload: {
        aps: {
          "mutable-content": 1,
        },
      },
    };
    if (finalImageUrl) {
      message.apns.fcmOptions = {
        image: finalImageUrl,
      };
    }

    // Web Overrides
    message.webpush = {
      notification: {},
      fcmOptions: {},
    };
    if (finalImageUrl) {
      message.webpush.notification.image = finalImageUrl;
    }
    if (finalActionUrl) {
      message.webpush.fcmOptions.link = finalActionUrl;
      message.webpush.notification.click_action = finalActionUrl;
    }

    // Clean up empty webpush options
    if (Object.keys(message.webpush.notification).length === 0) {
      delete message.webpush.notification;
    }
    if (Object.keys(message.webpush.fcmOptions).length === 0) {
      delete message.webpush.fcmOptions;
    }
    if (Object.keys(message.webpush).length === 0) {
      delete message.webpush;
    }

    const response = await admin.messaging().send(message);
    console.log("Successfully sent FCM notification:", response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error("FCM Send Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Sends push notifications to multiple FCM tokens in batches of up to 500 using sendEachForMulticast.
 * Automatically cleans up dead/unregistered tokens.
 */
const sendMulticastNotification = async ({ tokens, title, body, imageUrl, actionUrl, data }) => {
  try {
    if (!tokens || !tokens.length) {
      return { success: true, sent: 0, failed: 0 };
    }

    const getValidUrl = (val) => (val && typeof val === "string" && val.trim().length > 0) ? val.trim() : null;
    const finalImageUrl = getValidUrl(imageUrl) || getValidUrl(data?.imageUrl) || getValidUrl(data?.image) || getValidUrl(data?.poster) || null;
    const finalActionUrl = getValidUrl(actionUrl) || getValidUrl(data?.actionUrl) || getValidUrl(data?.link) || null;

    if (!firebaseInitialized) {
      console.log(`[FCM Mock] Multicast simulated for ${tokens.length} tokens: "${title}"`);
      return { success: true, sent: tokens.length, failed: 0 };
    }

    // Convert data fields to strings, as FCM data payload requires string values
    const stringifiedData = {};
    if (data) {
      Object.keys(data).forEach((key) => {
        stringifiedData[key] = String(data[key]);
      });
    }

    if (finalImageUrl) {
      stringifiedData.imageUrl = String(finalImageUrl);
      stringifiedData.image = String(finalImageUrl);
      stringifiedData.poster = String(finalImageUrl);
    }
    if (finalActionUrl) {
      stringifiedData.actionUrl = String(finalActionUrl);
      stringifiedData.link = String(finalActionUrl);
    }

    const baseMessage = {
      notification: {
        title,
        body,
        ...(finalImageUrl && { image: finalImageUrl }),
      },
      data: stringifiedData,
      ...(finalImageUrl && {
        android: {
          notification: {
            image: finalImageUrl,
          },
        },
      }),
      apns: {
        payload: {
          aps: {
            "mutable-content": 1,
          },
        },
        ...(finalImageUrl && {
          fcmOptions: {
            image: finalImageUrl,
          },
        }),
      },
      webpush: {
        ...(finalActionUrl && {
          fcmOptions: { link: finalActionUrl },
          notification: { click_action: finalActionUrl, ...(finalImageUrl && { image: finalImageUrl }) },
        }),
      },
    };

    const BATCH_SIZE = 500;
    let totalSent = 0;
    let totalFailed = 0;
    const deadTokens = [];

    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const chunkTokens = tokens.slice(i, i + BATCH_SIZE);
      try {
        const response = await admin.messaging().sendEachForMulticast({
          ...baseMessage,
          tokens: chunkTokens,
        });

        totalSent += response.successCount;
        totalFailed += response.failureCount;

        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            if (
              errorCode === "messaging/registration-token-not-registered" ||
              errorCode === "messaging/invalid-registration-token" ||
              errorCode === "messaging/invalid-argument"
            ) {
              deadTokens.push(chunkTokens[idx]);
            }
          }
        });
      } catch (chunkError) {
        console.error(`[FCM Multicast] Batch error at chunk offset ${i}:`, chunkError.message);
        totalFailed += chunkTokens.length;
      }
    }

    console.log(`[FCM Multicast] Finished: ${totalSent} sent, ${totalFailed} failed.`);

    // Clean up dead/unregistered tokens from the database in the background
    if (deadTokens.length > 0) {
      try {
        const User = require("../models/user.model");
        const cleanResult = await User.updateMany(
          { fcmToken: { $in: deadTokens } },
          { $unset: { fcmToken: "", fcmTokenUpdatedAt: "" } }
        );
        console.log(`[FCM Cleanup] Purged ${cleanResult.modifiedCount} invalid/unregistered FCM tokens.`);
      } catch (cleanupErr) {
        console.error("[FCM Cleanup Error]:", cleanupErr.message);
      }
    }

    return { success: true, sent: totalSent, failed: totalFailed };
  } catch (error) {
    console.error("[FCM Multicast Error]:", error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendPushNotification, sendMulticastNotification };

