const axios = require("axios");
const fs = require("fs");

const getLibraryId = () => {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  if (!libraryId) {
    throw new Error("BUNNY_STREAM_LIBRARY_ID is not configured in environment variables");
  }
  return libraryId;
};

const getApiKey = () => {
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  if (!apiKey) {
    throw new Error("BUNNY_STREAM_API_KEY is not configured in environment variables");
  }
  return apiKey;
};

const isBunnyStreamConfigured = () => {
  return Boolean(process.env.BUNNY_STREAM_LIBRARY_ID && process.env.BUNNY_STREAM_API_KEY);
};

const getPullZoneHost = () => {
  const pullZone = String(process.env.BUNNY_STREAM_PULL_ZONE || "").trim();
  if (!pullZone) return "iframe.mediadelivery.net";
  if (pullZone.includes(".")) return pullZone;
  return `${pullZone}.b-cdn.net`;
};

const extractVideoGuid = (input) => {
  if (!input || typeof input !== "string") return null;
  const match = input.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
  if (match) return match[0];
  if (!input.includes("/") && !input.includes("http")) {
    return input.trim();
  }
  return null;
};

const getStreamUrls = (guid) => {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID || "";
  const pullZoneHost = getPullZoneHost();

  const hlsUrl = `https://${pullZoneHost}/${guid}/playlist.m3u8`;
  const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${guid}`;
  const directUrl = `https://iframe.mediadelivery.net/play/${libraryId}/${guid}`;

  return {
    guid,
    hlsUrl,
    embedUrl,
    directUrl,
    url: hlsUrl,
  };
};

/**
 * Creates an empty video entry in Bunny Stream library.
 * @param {string} title
 * @returns {Promise<Object>} Response containing guid, libraryId, title, status, etc.
 */
const createVideo = async (title = "Untitled Video") => {
  try {
    const libraryId = getLibraryId();
    const apiKey = getApiKey();

    const response = await axios.post(
      `https://video.bunnycdn.com/library/${libraryId}/videos`,
      { title },
      {
        headers: {
          AccessKey: apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Bunny Stream Create Video Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Uploads video binary (stream, buffer, or file) to Bunny Stream by video GUID.
 * @param {Object} params
 * @param {string} params.videoId
 * @param {ReadableStream} [params.stream]
 * @param {Buffer} [params.buffer]
 * @param {string} [params.filePath]
 * @param {string} [params.contentType]
 * @returns {Promise<Object>} Response data
 */
const uploadVideoStream = async ({
  videoId,
  stream,
  buffer,
  filePath,
  contentType = "application/octet-stream",
}) => {
  try {
    const libraryId = getLibraryId();
    const apiKey = getApiKey();

    let dataPayload = stream || buffer;
    if (!dataPayload && filePath) {
      dataPayload = fs.createReadStream(filePath);
    }

    if (!dataPayload) {
      throw new Error("No video data (stream, buffer, or filePath) provided for Bunny Stream upload");
    }

    const response = await axios.put(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
      dataPayload,
      {
        headers: {
          AccessKey: apiKey,
          "Content-Type": contentType,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Bunny Stream Upload Video Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * High-level helper: Creates a video entry in Bunny Stream and uploads the binary payload.
 * @param {Object} params
 * @param {string} [params.title]
 * @param {ReadableStream} [params.stream]
 * @param {Buffer} [params.buffer]
 * @param {string} [params.filePath]
 * @param {string} [params.contentType]
 * @returns {Promise<Object>} Contains guid, hlsUrl, embedUrl, directUrl, url
 */
const uploadVideoToStream = async ({
  title = "Untitled Video",
  stream,
  buffer,
  filePath,
  contentType = "application/octet-stream",
}) => {
  const created = await createVideo(title);
  const guid = created.guid || created.id || created.videoId;

  if (!guid) {
    throw new Error("Failed to retrieve video GUID from Bunny Stream response");
  }

  await uploadVideoStream({
    videoId: guid,
    stream,
    buffer,
    filePath,
    contentType,
  });

  const urls = getStreamUrls(guid);

  return {
    guid,
    ...urls,
    created,
  };
};

/**
 * Deletes a video from Bunny Stream using video ID or URL.
 * @param {string} videoIdOrUrl
 * @returns {Promise<boolean>}
 */
const deleteVideoFromStream = async (videoIdOrUrl) => {
  const guid = extractVideoGuid(videoIdOrUrl);
  if (!guid) {
    console.warn(`[BunnyStream] Could not extract video GUID from input: ${videoIdOrUrl}`);
    return false;
  }

  try {
    const libraryId = getLibraryId();
    const apiKey = getApiKey();

    await axios.delete(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${guid}`,
      {
        headers: {
          AccessKey: apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`[BunnyStream] Successfully deleted video GUID: ${guid}`);
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn(`[BunnyStream] Video GUID ${guid} not found on server (already deleted)`);
      return true;
    }
    console.error(
      `[BunnyStream] Failed to delete video GUID ${guid}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Retrieves video metadata / processing status from Bunny Stream.
 * @param {string} videoIdOrUrl
 * @returns {Promise<Object>}
 */
const getVideoStatus = async (videoIdOrUrl) => {
  const guid = extractVideoGuid(videoIdOrUrl);
  if (!guid) {
    throw new Error(`Invalid video GUID or URL: ${videoIdOrUrl}`);
  }

  try {
    const libraryId = getLibraryId();
    const apiKey = getApiKey();

    const response = await axios.get(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${guid}`,
      {
        headers: {
          AccessKey: apiKey,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      `[BunnyStream] Get video status error for GUID ${guid}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

module.exports = {
  createVideo,
  deleteVideoFromStream,
  extractVideoGuid,
  getStreamUrls,
  getVideoStatus,
  isBunnyStreamConfigured,
  uploadVideoStream,
  uploadVideoToStream,
};