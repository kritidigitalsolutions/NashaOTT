const express = require("express");

const router = express.Router();

const upload = require(
  "../../middlewares/upload.middleware"
);

const {
  isAdmin, hasPermission } = require(
  "../../middlewares/admin.middleware"
);

const {
  addDramaEpisode,
  getDramaEpisodes,
  updateDramaEpisode,
  deleteDramaEpisode,
  searchDramaEpisodes,
} = require(
  "../../controllers/admin/dramaEpisode.controller"
);


// ========================================
// MULTER
// ========================================
const dramaEpisodeUpload =
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
// ADD EPISODE
// ========================================
router.post("/:shortDramaId/add",isAdmin, hasPermission("series"),dramaEpisodeUpload,addDramaEpisode);

// ========================================
// SEARCH EPISODES
// ========================================
router.get("/search",isAdmin, hasPermission("series"),searchDramaEpisodes);


// ========================================
// GET ALL EPISODES
// ========================================
router.get("/:shortDramaId",isAdmin, hasPermission("series"),getDramaEpisodes);



// ========================================
// UPDATE EPISODE
// ========================================
router.patch("/:id",isAdmin, hasPermission("series"),dramaEpisodeUpload,updateDramaEpisode);


// ========================================
// DELETE EPISODE
// ========================================
router.delete("/:id",isAdmin, hasPermission("series"),deleteDramaEpisode);


module.exports = router;