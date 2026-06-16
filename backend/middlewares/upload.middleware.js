const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Bunny CDN upload is intentionally disabled. Files are written to backend/uploads.
// const {
//   uploadStreamToBunny,
// } = require("../cdn/bunnyCDN");

const getUploadInfo = (req, file) => {
  let type = "movies";

  if (req.originalUrl.includes("/series")) type = "series";
  if (req.originalUrl.includes("/episodes")) type = "episodes";
  if (req.originalUrl.includes("/drama-episodes")) type = "dramaepisodes";
  if (req.originalUrl.includes("/shortdramas")) type = "shortdramas";
  if (req.originalUrl.includes("/user")) type = "profile";
  if (req.originalUrl.includes("/support")) type = "support";

  let subfolder = "others";

  if (file.fieldname === "poster" || file.fieldname === "thumbnail") {
    subfolder = "posters";
  } else if (file.fieldname === "banner") {
    subfolder = "banners";
  } else if (file.fieldname === "video") {
    subfolder = "videos";
  } else if (file.fieldname === "trailer") {
    subfolder = "trailers";
  } else if (file.fieldname.startsWith("castImage_")) {
    subfolder = "cast";
  } else if (file.fieldname === "attachments") {
    subfolder = "attachments";
  }

  return {
    type,
    subfolder,
    uploadFolder: `${type}/${subfolder}`,
  };
};

const storage = {
  _handleFile: async (req, file, cb) => {
    try {
      const uploadInfo = getUploadInfo(req, file);
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname).toLowerCase();

      const filename = `${uniqueName}${ext}`;
      const relativePath = `${uploadInfo.uploadFolder}/${filename}`;
      const destination = path.join(__dirname, "../uploads", uploadInfo.type, uploadInfo.subfolder);
      const outputPath = path.join(destination, filename);

      fs.mkdirSync(destination, { recursive: true });

      console.log("================================");
      console.log("LOCAL UPLOAD START");
      console.log("FIELD:", file.fieldname);
      console.log("NAME:", file.originalname);
      console.log("TYPE:", file.mimetype);
      console.log("LOCAL PATH:", relativePath);

      const outStream = fs.createWriteStream(outputPath);
      file.stream.pipe(outStream);

      outStream.on("error", cb);

      outStream.on("finish", () => {
        const localUrl = `${req.protocol}://${req.get("host")}/uploads/${relativePath}`;

        console.log("LOCAL UPLOAD COMPLETE:", localUrl);
        console.log("================================");

        cb(null, {
          filename,
          destination,
          path: localUrl,
          cdnUrl: localUrl,
          localUrl,
          remotePath: relativePath,
        });
      });
    } catch (error) {
      console.error("LOCAL UPLOAD ERROR");
      console.error(error);
      console.error(error.message);

      cb(error);
    }
  },

  _removeFile: (req, file, cb) => {
    cb(null);
  },
};

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/mkv",
    "video/webm",
    "video/quicktime",
  ];

  if (req.originalUrl && req.originalUrl.includes("/support")) {
    const allowedSupportTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "application/zip",
      "application/x-zip-compressed",
      "application/octet-stream",
    ];

    if (
      allowedMimeTypes.includes(file.mimetype) ||
      allowedSupportTypes.includes(file.mimetype)
    ) {
      return cb(null, true);
    }
  } else {
    if (allowedMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
  }

  cb(new Error("Invalid file type"), false);
};

// Lazy-evaluated so a missing env var doesn't crash app startup and abort
// all route registration. The error is thrown at first upload request instead.
const getMaxUploadSize = () => {
  const size = Number(process.env.MAX_UPLOAD_SIZE);
  if (!size) {
    throw new Error("MAX_UPLOAD_SIZE env variable is not set — check your .env file");
  }
  return size;
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: getMaxUploadSize(),  // driven entirely by .env, no hardcoded fallback
  },
});

// const upload = multer({
//   storage,
//   fileFilter,
//   limits: {
//     fileSize: Number(process.env.MAX_UPLOAD_SIZE) || 500 * 1024 * 1024,
//   },
// });

module.exports = upload;
