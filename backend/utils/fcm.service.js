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

module.exports = { sendPushNotification };
