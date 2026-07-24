const express = require("express");
const router = express.Router();
const { getHomeContent, searchContent, getSingleContent } = require("../../controllers/content.controller");

router.get("/", getHomeContent);
router.get("/search", searchContent);
router.get("/:id", getSingleContent);

module.exports = router;
