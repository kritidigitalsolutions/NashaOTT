const express = require("express");

const router = express.Router();

const upload = require(
  "../../middlewares/upload.middleware"
);
const validateFileSizes = require("../../middlewares/validateFileSizes");
const {
  isAdmin, hasPermission } = require("../../middlewares/admin.middleware");

const {
  addSeries,
  getAllSeries,
  getSeriesById,
  updateSeries,
  deleteSeries,
  searchSeries,
  bulkToggleHideAdult,
} = require(
  "../../controllers/admin/series.controller"
);


// ========================================
// MULTER FIELDS
// ========================================
const seriesUpload =
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
  ]);


// ========================================
// ROUTES (Protected)
// ========================================
router.post("/add", isAdmin, hasPermission("series"), seriesUpload, validateFileSizes, addSeries);
router.patch("/bulk-hide-adult", isAdmin, hasPermission("series"), bulkToggleHideAdult);
router.patch("/:id", isAdmin, hasPermission("series"), seriesUpload, validateFileSizes, updateSeries);
// router.post(
//   "/add",
//   isAdmin, hasPermission("series"),
//   seriesUpload,
//   addSeries
// );

router.get(
  "/",
  isAdmin, hasPermission("series"),
  getAllSeries
);

router.get(
  "/search",
  isAdmin, hasPermission("series"),
  searchSeries
);


router.get(
  "/:id",
  isAdmin, hasPermission("series"),
  getSeriesById
);

// router.patch(
//   "/:id",
//   isAdmin, hasPermission("series"),
//   seriesUpload,
//   updateSeries
// );

router.delete(
  "/:id",
  isAdmin, hasPermission("series"),
  deleteSeries
);



module.exports = router;