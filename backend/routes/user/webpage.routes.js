const express = require("express");
const router = express.Router();
const {
  getWebpageLayout,
  getHeroBanners,
  getSections,
  getSectionBySlug,
  getWebpageContentById
} = require("../../controllers/webpage.controller");

// ========================================
// PUBLIC WEBPAGE ROUTES
// ========================================

// Get full layout config
router.get("/layout", getWebpageLayout);

// Get hero banners only
router.get("/banners", getHeroBanners);

// Get all sections
router.get("/sections", getSections);

// Get a section by slug
router.get("/sections/:slug", getSectionBySlug);

// Get detailed content by ID
router.get("/content/:id", getWebpageContentById);

module.exports = router;
