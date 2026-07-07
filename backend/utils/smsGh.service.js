const axios = require("axios");
const { URL } = require("url");

const SMS_GH_URL =
  process.env.SMS_GH_URL ||
  "https://www.smsgatewayhub.com/api/mt/SendSMS";

const requiredConfig = [
  "SMS_GH_API_KEY",
  "SMS_GH_SENDER_ID",
  "SMS_GH_ENTITY_ID",
  "SMS_GH_DLT_TEMPLATE_ID",
];

const getMissingConfig = () =>
  requiredConfig.filter((key) => !process.env[key]);

const buildOtpMessage = (otp) => {
  const template = process.env.SMS_GH_OTP_TEXT;

  if (!template) {
    return `Your OTP is ${otp}. It is valid for 5 minutes.`;
  }

  return template
    .replace(/\{\{\s*otp\s*\}\}/gi, otp)
    .replace(/\{#var#\}/gi, otp)
    .replace(/\{otp\}/gi, otp);
};

const buildSmsGhUrl = (params, hideApiKey = false) => {
  const url = new URL(SMS_GH_URL);
  const safeParams = {
    ...params,
    APIKey: hideApiKey && params.APIKey ? "***hidden***" : params.APIKey,
  };

  Object.entries(safeParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
};

const isSmsGhSuccess = (data) => {
  if (!data) {
    return false;
  }

  if (typeof data === "string") {
    const normalized = data.toLowerCase();
    return (
      normalized.includes("success") ||
      normalized.includes("submitted") ||
      normalized.includes("accepted")
    );
  }

  if (typeof data === "object") {
    const status = String(
      data.ErrorCode ||
        data.errorCode ||
        data.Status ||
        data.status ||
        data.Response ||
        data.response ||
        ""
    ).toLowerCase();

    return (
      status === "000" ||
      status === "0" ||
      status === "success" ||
      status.includes("success") ||
      status.includes("submitted") ||
      status.includes("accepted")
    );
  }

  return false;
};

const sendOtpSms = async ({ phone, otp }) => {
  const missingConfig = getMissingConfig();

  if (missingConfig.length) {
    const error = new Error(
      `SMSGH config missing: ${missingConfig.join(", ")}`
    );
    error.code = "SMS_GH_CONFIG_MISSING";
    throw error;
  }

  const message = buildOtpMessage(otp);
  console.log("Template:");
console.log(process.env.SMS_GH_OTP_TEXT);

console.log("OTP:");
console.log(otp);

console.log("Final Message:");
console.log(message);

console.log("Message JSON:");
console.log(JSON.stringify(message));
  const number = String(phone).replace(/^\+/, "");
  const params = {
    APIKey: process.env.SMS_GH_API_KEY,
    senderid: process.env.SMS_GH_SENDER_ID,
    channel: process.env.SMS_GH_CHANNEL || "2",
    DCS: process.env.SMS_GH_DCS || "0",
    flashsms: process.env.SMS_GH_FLASH_SMS || "0",
    number,
    text: message,
    route: process.env.SMS_GH_ROUTE || "1",
    EntityId: process.env.SMS_GH_ENTITY_ID,
    dlttemplateid: process.env.SMS_GH_DLT_TEMPLATE_ID,
  };
  const requestUrl = buildSmsGhUrl(params);
  const debugUrl = buildSmsGhUrl(params, true);
  console.log("SMSGH request URL:", debugUrl);

  let response;

  try {
    response = await axios.get(requestUrl, {
      timeout: Number(process.env.SMS_GH_TIMEOUT_MS) || 10000,
    });
  } catch (error) {
    console.error("SMSGH request failed:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }

  console.log("SMSGH response:", response.data);

  if (!isSmsGhSuccess(response.data)) {
    const error = new Error("SMSGH rejected the OTP SMS request");
    error.code = "SMS_GH_SEND_FAILED";
    error.responseData = response.data;
    throw error;
  }

  return response.data;
};

module.exports = {
  sendOtpSms,
};
