const express = require("express");
const router = express.Router();
const { getAllSeries, getSeriesBySlug, getSeriesById, getEpisodesBySeries } = require("../../controllers/series.controller");

router.get("/", getAllSeries);
router.get("/slug/:slug", getSeriesBySlug);
router.get("/episodes/:seriesId", getEpisodesBySeries);
router.get("/:id", getSeriesById);


module.exports = router;
