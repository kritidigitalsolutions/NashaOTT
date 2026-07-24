const fs = require("fs");
const path = require("path");
const { deleteFromBunny } = require("../cdn/bunnyCDN");
const {
  deleteVideoFromStream,
  extractVideoGuid,
} = require("../services/bunnyStream.service");

/**
 * Returns the CDN/Stream URL for a multer-processed file, or the fallback value.
 *
 * @param {Object|null} file - Multer file object (may have cdnUrl, path, url)
 * @param {string} fallback - Fallback value
 * @returns {string} The CDN/Stream URL or fallback
 */
const getMediaUrl = (file, fallback = "") => {
  if (!file) return fallback;
  return file.cdnUrl || file.url || file.path || fallback;
};

/**
 * Helper to check if a URL is a Bunny Stream video URL.
 */
const isBunnyStreamUrl = (urlStr) => {
  if (!urlStr || typeof urlStr !== "string") return false;
  if (urlStr.includes("mediadelivery.net") || urlStr.includes("/playlist.m3u8")) {
    return true;
  }
  const streamPullZone = process.env.BUNNY_STREAM_PULL_ZONE;
  if (streamPullZone && urlStr.includes(streamPullZone)) {
    return true;
  }
  return false;
};

/**
 * Deletes a media file from Bunny Stream (if video/trailer), Bunny CDN Storage (if image),
 * or local filesystem (if legacy path).
 *
 * @param {string} filePath - URL or path to delete
 */
const deleteMedia = async (filePath) => {
  if (!filePath || typeof filePath !== "string") return;

  if (filePath.startsWith("http")) {
    // Local /uploads/ check
    const match = filePath.match(/\/uploads\/(.+)$/);
    if (match) {
      const relativePath = match[1];
      const fullPath = path.join(__dirname, "../uploads", relativePath);
      try {
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`Successfully deleted local file: ${fullPath}`);
        }
      } catch (err) {
        console.error("Local file deletion error:", err.message);
      }
      return;
    }

    // Bunny Stream video URL check
    if (isBunnyStreamUrl(filePath)) {
      try {
        await deleteVideoFromStream(filePath);
      } catch (err) {
        console.error("BunnyStream delete error:", err.message);
      }
      return;
    }

    // Bunny CDN Storage Zone check
    try {
      await deleteFromBunny(filePath);
    } catch (err) {
      console.error("BunnyCDN storage delete error:", err.message);
    }
    return;
  }

  // Check if raw GUID string for Bunny Stream
  const guid = extractVideoGuid(filePath);
  if (guid && !filePath.includes("/")) {
    try {
      await deleteVideoFromStream(guid);
    } catch (err) {
      console.error("BunnyStream delete error:", err.message);
    }
    return;
  }

  // Legacy local relative path
  try {
    const fullPath = path.join(__dirname, "../", filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.warn(`Deleted legacy local file: ${filePath}`);
    }
  } catch (err) {
    console.error("Local file deletion error:", err.message);
  }
};

/**
 * Deletes multiple media files in parallel.
 *
 * @param  {...string} files - URLs or paths to delete
 */
const deleteMediaFiles = async (...files) => {
  await Promise.all(
    files
      .filter(Boolean)
      .map((file) => deleteMedia(file))
  );
};

module.exports = {
  getMediaUrl,
  deleteMedia,
  deleteMediaFiles,
  isBunnyStreamUrl,
};
