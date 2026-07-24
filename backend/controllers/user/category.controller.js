const Category = require("../../models/category.model");
const Movie = require("../../models/movie.model");
const Series = require("../../models/series.model");
const ShortDrama = require("../../models/shortdrama.model");

// ========================================
// GET ACTIVE CATEGORIES (USER - READ ONLY)
// ========================================
const getActiveCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("GET ACTIVE CATEGORIES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

// ========================================
// GET CATEGORY BY SLUG (USER - READ ONLY)
// ========================================
const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await Category.findOne({
      slug: String(slug).toLowerCase().trim(),
      isActive: true,
    }).lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.json({
      success: true,
      category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch category",
    });
  }
};

// ========================================
// GET CONTENT BY CATEGORY (USER - READ ONLY)
// ========================================
const getContentByCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const normalizedSlug = String(slug).toLowerCase().trim();

    // Check category exists
    const category = await Category.findOne({ slug: normalizedSlug, isActive: true }).lean();
    
    const categoryName = category ? category.name : normalizedSlug;

    // Search query for matching category name or slug in category array
    const categoryRegex = new RegExp(`^${categoryName}$|^${normalizedSlug}$`, "i");

    const [movies, series, shortDramas] = await Promise.all([
      Movie.find({ category: { $elemMatch: { $regex: categoryRegex } } })
        .sort({ priority: -1, createdAt: -1 })
        .lean(),
      Series.find({ category: { $elemMatch: { $regex: categoryRegex } } })
        .sort({ priority: -1, createdAt: -1 })
        .lean(),
      ShortDrama.find({ category: { $elemMatch: { $regex: categoryRegex } } })
        .sort({ priority: -1, createdAt: -1 })
        .lean(),
    ]);

    const formattedMovies = movies.map((m) => ({ ...m, type: "movie" }));
    const formattedSeries = series.map((s) => ({ ...s, type: "series" }));
    const formattedShortDramas = shortDramas.map((d) => ({ ...d, type: "shortdrama" }));

    const content = [...formattedMovies, ...formattedSeries, ...formattedShortDramas].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0) || new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.json({
      success: true,
      category: category || { name: categoryName, slug: normalizedSlug },
      total: content.length,
      content,
    });
  } catch (error) {
    console.error("GET CONTENT BY CATEGORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch content for category",
    });
  }
};

module.exports = {
  getActiveCategories,
  getCategoryBySlug,
  getContentByCategory,
};
