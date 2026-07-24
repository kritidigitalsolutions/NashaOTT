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
  addShortDrama,
  getAllShortDramas,
  getShortDramaById,
  updateShortDrama,
  deleteShortDrama,
  searchShortDrama,
} = require(
  "../../controllers/admin/shortdrama.controller"
);


// ========================================
// MULTER FIELDS
// ========================================
const dramaUpload =
  upload.fields([
    {
      name: "poster",
      maxCount: 1,
    },
    {
      name: "banner",
      maxCount: 1,
    },
    {
      name: "trailer",
      maxCount: 1,
    },

    {
      name: "castImage_0",
      maxCount: 1,
    },
    {
      name: "castImage_1",
      maxCount: 1,
    },
    {
      name: "castImage_2",
      maxCount: 1,
    },
    {
      name: "castImage_3",
      maxCount: 1,
    },
    {
      name: "castImage_4",
      maxCount: 1,
    },
  ]);


// ========================================
// ROUTES
// ========================================

// ADD
router.post(
  "/add",
  isAdmin, hasPermission("movies"),
  dramaUpload,
  addShortDrama
);


// GET ALL
router.get(
  "/",isAdmin, hasPermission("movies"),
  getAllShortDramas
);


// SEARCH
router.get(
  "/search",isAdmin, hasPermission("movies"),
  searchShortDrama
);


// GET SINGLE
router.get(
  "/:id",isAdmin, hasPermission("movies"),
  getShortDramaById
);


// UPDATE
router.patch(
  "/:id",
  isAdmin, hasPermission("movies"),
  dramaUpload,
  updateShortDrama
);


// DELETE
router.delete(
  "/:id",
  isAdmin, hasPermission("movies"),
  deleteShortDrama
);

module.exports = router;