const express = require("express");

const router = express.Router();

const upload = require(
  "../../middlewares/upload.middleware"
);
const validateFileSizes = require("../../middlewares/validateFileSizes");

const {
  isAdmin, hasPermission } = require("../../middlewares/admin.middleware");

const {
  addEpisode,
  getEpisodes,
  updateEpisode,
  deleteEpisode,
  deleteSeason,
  searchEpisodes,
} = require(
  "../../controllers/admin/episode.controller"
);


// ========================================
// MULTER
// ========================================
const episodeUpload =
  upload.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]);


// ========================================
// ROUTES (Protected)
// ========================================
router.post("/add", isAdmin, hasPermission("series"), episodeUpload, validateFileSizes, addEpisode);
router.patch("/:id", isAdmin, hasPermission("series"), episodeUpload, validateFileSizes, updateEpisode);
// router.post(
//   "/add",
//   isAdmin, hasPermission("series"),
//   episodeUpload,
//   addEpisode
// );

router.get(
  "/",
  isAdmin, hasPermission("series"),
  getEpisodes
);

router.get(
  "/search",
  isAdmin, hasPermission("series"),
  searchEpisodes
);


// router.patch(
//   "/:id",

//   isAdmin, hasPermission("series"),
//   episodeUpload,
//   updateEpisode
// );

router.delete(
  "/season/:seriesId/:seasonNumber",
  isAdmin, hasPermission("series"),
  deleteSeason
);

router.delete(
  "/:id",
  isAdmin, hasPermission("series"),
  deleteEpisode
);




module.exports = router;