const express = require("express");

const router = express.Router();

const upload = require(
  "../../middlewares/upload.middleware"
);

const validateFileSizes = require("../../middlewares/validateFileSizes");

const {
  isAdmin, hasPermission } = require("../../middlewares/admin.middleware");

const {
  addMovie,
  getAllMovies,
  getMovieById,
  updateMovie,
  deleteMovie,
  searchMovies,
  bulkToggleHideAdult,
} = require(
  "../../controllers/admin/movie.controller"
);


// ========================================
// MULTER FIELDS
// ========================================
const movieUpload = upload.fields([
  {
    name: "poster",
    maxCount: 1,
  },
  {
    name: "banner",
    maxCount: 1,
  },
  {
    name: "video",
    maxCount: 1,
  },
  {
    name: "trailer",
    maxCount: 1,
  },

  // Cast images
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
// ROUTES (Protected)
// ========================================
router.post("/add", isAdmin, hasPermission("movies"), movieUpload, validateFileSizes, addMovie);
router.patch("/bulk-hide-adult", isAdmin, hasPermission("movies"), bulkToggleHideAdult);
router.patch("/:id", isAdmin, hasPermission("movies"), movieUpload, validateFileSizes, updateMovie);
// router.post(
//   "/add",
//   isAdmin, hasPermission("movies"),
//   movieUpload,
//   addMovie
// );

router.get(
  "/",
  isAdmin, hasPermission("movies"),
  getAllMovies
);

router.get(
  "/search",
  isAdmin, hasPermission("movies"),
  searchMovies
);


router.get(
  "/:id",
  isAdmin, hasPermission("movies"),
  getMovieById
);

// router.patch(
//   "/:id",
//   isAdmin, hasPermission("movies"),
//   movieUpload,
//   updateMovie
// );

router.delete(
  "/:id",
  isAdmin, hasPermission("movies"),
  deleteMovie
);



module.exports = router;