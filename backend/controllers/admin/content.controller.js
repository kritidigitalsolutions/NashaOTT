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

// ========================================
// GET PAGINATED CONTENT (COMBINED MOVIES & SERIES)
// ========================================

exports.getPaginatedContent = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.is18Plus !== undefined) {
      query.is18Plus = req.query.is18Plus === "true";
    }
    if (req.query.isHide !== undefined) {
      query.isHide = req.query.isHide === "true";
    }

    // Since we need to paginate across two collections, we fetch from both, merge, sort, and slice
    // A more scalable approach for massive datasets would be aggregation with $unionWith
    
    // Using aggregation for proper cross-collection pagination and sorting
    const pipeline = [
      { $match: query },
      { $addFields: { contentType: "movies" } },
      {
        $unionWith: {
          coll: "series",
          pipeline: [
            { $match: query },
            { $addFields: { contentType: "series" } }
          ]
        }
      },
      { $sort: { priority: -1, createdAt: -1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: limit }]
        }
      }
    ];

    const result = await Movie.aggregate(pipeline);
    const total = result[0]?.metadata[0]?.total || 0;
    const content = result[0]?.data || [];

    return res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      content
    });

  } catch (error) {
    console.error("GET PAGINATED CONTENT ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};