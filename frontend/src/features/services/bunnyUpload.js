import API from "../../api/axios";
import axios from "axios";

let cachedConfig = null;

export const fetchBunnyConfig = async () => {
  if (cachedConfig) return cachedConfig;

  const response = await API.get("/admin/auth/bunny-config");
  cachedConfig = response.data;

  return cachedConfig;
};

const uploadThroughBackend = async (
  file,
  type,
  subfolder,
  onProgress
) => {
  const formData = new FormData();

  formData.append("type", type);
  formData.append("subfolder", subfolder);
  formData.append("file", file);

  const response = await API.post(
    "/admin/auth/bunny-upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) /
              progressEvent.total
          );

          onProgress(percentCompleted);
        }
      },
    }
  );

  return response.data.url;
};

const safePathSegment = (value) => {
  return encodeURIComponent(
    String(value || "")
      .trim()
      .replace(/^\/+|\/+$/g, "")
  );
};

const getExtension = (file) => {
  const name = file?.name || "";
  const ext = name.includes(".")
    ? name.split(".").pop().toLowerCase()
    : "";

  return ext ? `.${ext}` : "";
};

const uploadDirectToBunny = async (
  file,
  type,
  subfolder,
  onProgress
) => {
  const {
    storageHosts = [],
    storageZone,
    accessKey,
    cdnUrl,
  } = await fetchBunnyConfig();

  const filename = `${Date.now()}-${Math.round(
    Math.random() * 1000000000
  )}${getExtension(file)}`;

  const remoteFolder =
    `${safePathSegment(type)}/${safePathSegment(
      subfolder
    )}`;

  let lastError = null;

  for (const storageHost of storageHosts) {
    const uploadUrl =
      `https://${storageHost}/${storageZone}/${remoteFolder}/${filename}`;

    try {
      const response = await axios.put(uploadUrl, file, {
        headers: {
          AccessKey: accessKey,
          "Content-Type":
            file.type || "application/octet-stream",
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) /
                progressEvent.total
            );

            onProgress(percentCompleted);
          }
        },
      });

      if (response.status >= 200 && response.status < 300) {
        return `${cdnUrl}/${remoteFolder}/${filename}`;
      }

      lastError = new Error(
        `Bunny upload failed (${response.status})`
      );
    } catch (err) {
      lastError = err;
      const status = err?.response?.status;
      const isRetryable = status === 401 || status === 403 || !err?.response;

      if (!isRetryable) {
        break;
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error("Bunny upload failed");
};

export const uploadToBunny = async (
  file,
  type,
  subfolder,
  onProgress
) => {
  if (!file) return "";

  const isVideo =
    subfolder === "videos" ||
    subfolder === "trailers" ||
    (file.type && file.type.startsWith("video/"));

  if (isVideo) {
    // Video/trailer uploads are routed to backend for Bunny Stream library creation & transcoding
    return uploadThroughBackend(file, type, subfolder, onProgress);
  }

  try {
    return await uploadDirectToBunny(file, type, subfolder, onProgress);
  } catch (err) {
    console.warn("Direct Bunny upload failed, retrying through backend.", err);
    return uploadThroughBackend(file, type, subfolder, onProgress);
  }
};
