// Commented out BunnyCDN delete utility
// const { deleteFromBunny } = require("../cdn/bunnyCDN");
const fs = require("fs");
const path = require("path");

/**
 * Returns the CDN URL for a multer-processed file, or the fallback value.
 * Never constructs local /uploads/... paths — CDN URL only.
 *
 * @param {Object|null} file - Multer file object (may have cdnUrl, path)
 * @param {string} fallback - Fallback value (e.g. req.body.poster which may already be a CDN URL)
 * @returns {string} The CDN URL or fallback
 */
const getMediaUrl = (file, fallback = "") => {
  if (!file) return fallback;
  // cdnUrl is set by our custom multer storage engine (upload.middleware.js)
  // file.path is also set to the CDN URL by upload.middleware.js
  return file.cdnUrl || file.path || fallback;
};

/**
 * Deletes a media file. If the path is a full URL (BunnyCDN), deletes from CDN.
 * If it's a legacy local path, attempts local deletion (backward compat during migration).
 *
 * @param {string} filePath - URL or local path to delete
 */
const deleteMedia = async (filePath) => {
  if (!filePath) return;

  if (typeof filePath === "string" && filePath.startsWith("http")) {
    // Check if it's a locally served file URL
    const match = filePath.match(/\/uploads\/(.+)$/);
    if (match) {
      const relativePath = match[1];
      const fullPath = path.join(__dirname, "../uploads", relativePath);
      try {
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`Successfully deleted local file: ${fullPath}`);
        } else {
          console.warn(`Local file to delete not found: ${fullPath}`);
        }
      } catch (err) {
        console.error("Local file deletion error:", err.message);
      }
      return;
    }

    // BunnyCDN URL or other HTTP URL — skip actual deletion as credentials are deactivated
    console.warn(`[BUNNY DEPRECATED] Skip deleting legacy BunnyCDN URL: ${filePath}`);
    // Commented out BunnyCDN delete call
    // try {
    //   await deleteFromBunny(filePath);
    // } catch (err) {
    //   console.error("BunnyCDN delete error:", err.message);
    // }
    return;
  }

  // Legacy local path — attempt local deletion for backward compatibility
  try {
    const fullPath = path.join(__dirname, "../", filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.warn(`[MIGRATION] Deleted legacy local file: ${filePath}`);
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
};
