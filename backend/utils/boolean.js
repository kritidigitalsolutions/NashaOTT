const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  const normalized = String(value).trim().toLowerCase();

  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }

  return defaultValue;
};

const adultContentWarning =
  "This content is marked as 18+. Viewer age warning should be shown before playback.";

const getAdultContentWarning = (is18Plus) =>
  is18Plus ? adultContentWarning : undefined;

module.exports = {
  parseBoolean,
  getAdultContentWarning,
};
