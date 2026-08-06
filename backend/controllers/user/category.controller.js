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

    const formattedCategories = categories.map((cat) => ({
      _id: cat._id,
      name: cat.name,
      slug: cat.slug,
      priority: cat.priority !== undefined && cat.priority !== null ? cat.priority : 0,
      isActive: cat.isActive !== undefined ? cat.isActive : true,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));

    return res.json({
      success: true,
      count: formattedCategories.length,
      data: formattedCategories,
      categories: formattedCategories,
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

    const formattedCategory = {
      ...category,
      priority: category.priority !== undefined && category.priority !== null ? category.priority : 0,
    };

    return res.json({
      success: true,
      data: formattedCategory,
      category: formattedCategory,
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
    const idOrSlug = req.params.id || req.params.slug;
    const normalizedParam = String(idOrSlug || "").trim();

    const page = Math.max(0, parseInt(req.query.page, 10) || 0);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = page * limit;

    // Check category exists (by ID or Slug)
    const mongoose = require("mongoose");
    let category = null;
    if (mongoose.Types.ObjectId.isValid(normalizedParam)) {
      category = await Category.findById(normalizedParam).lean();
    }
    if (!category) {
      category = await Category.findOne({
        slug: normalizedParam.toLowerCase(),
        isActive: true,
      }).lean();
    }

    const categoryName = category ? category.name : normalizedParam;
    const categorySlug = category ? category.slug : normalizedParam.toLowerCase();

    // Search query for matching category name or slug in category array
    const categoryRegex = new RegExp(`^${categoryName}$|^${categorySlug}$`, "i");

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

    const allContent = [...formattedMovies, ...formattedSeries, ...formattedShortDramas].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0) || new Date(b.createdAt) - new Date(a.createdAt)
    );

    const total = allContent.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedContent = allContent.slice(skip, skip + limit);

    return res.json({
      success: true,
      category: category || { name: categoryName, slug: categorySlug },
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: (page + 1) * limit < total,
        hasPrevPage: page > 0,
      },
      content: paginatedContent,
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
