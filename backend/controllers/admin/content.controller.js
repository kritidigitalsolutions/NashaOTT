const Movie = require("../../models/movie.model");
const Series = require("../../models/series.model");
const ShortDrama = require("../../models/shortdrama.model");

// ========================================
// GET CONTENT STATS
// ========================================
exports.getContentStats = async (req, res) => {
  try {

    const movieCount =
      await Movie.countDocuments();

    const seriesCount =
      await Series.countDocuments();

    const dramaCount =
      await ShortDrama.countDocuments();

    res.json({
      success: true,
      movieCount,
      seriesCount,
      dramaCount,
      totalContent:
        movieCount +
        seriesCount +
        dramaCount
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ========================================
// GET ALL CONTENT (COMBINED)
// ========================================


exports.getAllContent = async (req, res) => {
  try {
    const movies = await Movie.find().lean();

    const series = await Series.find().lean();

    const dramas = await ShortDrama.find().lean();

    const content = [
      ...movies.map(item => ({
        ...item,
        contentType: "movie"
      })),

      ...series.map(item => ({
        ...item,
        contentType: "series"
      })),

      ...dramas.map(item => ({
        ...item,
        contentType: "drama"
      }))
    ];

    res.json({
      success: true,
      content
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};