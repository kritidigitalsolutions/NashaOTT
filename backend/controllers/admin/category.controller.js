const Category = require("../../models/category.model");
const Movie = require("../../models/movie.model");
const Series = require("../../models/series.model");
const ShortDrama = require("../../models/shortdrama.model");

// Helper to update categories across content models (Movie, Series, ShortDrama)
const syncContentCategories = async (oldName, oldSlug, newName, newSlug) => {
  const contentModels = [Movie, Series, ShortDrama];
  const oldTargets = [
    oldName,
    oldSlug,
    oldName ? oldName.toLowerCase() : null,
    oldSlug ? oldSlug.toLowerCase() : null,
  ].filter(Boolean);

  if (oldTargets.length === 0) return;

  for (const Model of contentModels) {
    if (!Model) continue;

    const regexTargets = oldTargets.map(
      (val) => new RegExp(`^${val.replace(/[-[\]{}()*+?.:=\\^$|#\s]/g, "\\$&")}$`, "i")
    );

    const items = await Model.find({
      category: { $in: regexTargets },
    });

    for (const item of items) {
      if (!Array.isArray(item.category)) continue;

      let isModified = false;
      const updatedCategories = item.category.map((catStr) => {
        const catTrimmed = String(catStr).trim();
        const catLower = catTrimmed.toLowerCase();

        if (oldName && catLower === oldName.toLowerCase()) {
          isModified = true;
          return newSlug;
        }
        if (oldSlug && catLower === oldSlug.toLowerCase()) {
          isModified = true;
          return newSlug;
        }
        return catTrimmed;
      });

      if (isModified) {
        item.category = Array.from(new Set(updatedCategories));

        if (item.isTrending !== undefined) {
          item.isTrending = item.category.some(
            (c) => String(c).toLowerCase() === "trending"
          );
        }

        await item.save();
      }
    }
  }
};

// Helper to remove deleted category from content models
const removeCategoryFromContent = async (categoryName, categorySlug) => {
  const contentModels = [Movie, Series, ShortDrama];
  const targets = [
    categoryName,
    categorySlug,
    categoryName ? categoryName.toLowerCase() : null,
    categorySlug ? categorySlug.toLowerCase() : null,
  ].filter(Boolean);

  if (targets.length === 0) return;

  for (const Model of contentModels) {
    if (!Model) continue;

    const regexTargets = targets.map(
      (val) => new RegExp(`^${val.replace(/[-[\]{}()*+?.:=\\^$|#\s]/g, "\\$&")}$`, "i")
    );

    const items = await Model.find({
      category: { $in: regexTargets },
    });

    for (const item of items) {
      if (!Array.isArray(item.category)) continue;

      const initialLength = item.category.length;
      item.category = item.category.filter((catStr) => {
        const catLower = String(catStr).trim().toLowerCase();
        const isMatchName = categoryName && catLower === categoryName.toLowerCase();
        const isMatchSlug = categorySlug && catLower === categorySlug.toLowerCase();
        return !isMatchName && !isMatchSlug;
      });

      if (item.category.length !== initialLength) {
        if (item.isTrending !== undefined) {
          item.isTrending = item.category.some(
            (c) => String(c).toLowerCase() === "trending"
          );
        }
        await item.save();
      }
    }
  }
};

// Helper to generate slug
const generateSlug = (text) => {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
};

// ========================================
// CREATE CATEGORY (ADMIN)
// ========================================
const createCategory = async (req, res) => {
  try {
    const { name, slug, priority, isActive } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const trimmedName = String(name).trim();
    const finalSlug = slug ? generateSlug(slug) : generateSlug(trimmedName);

    // Check for existing category with same name or slug
    const existing = await Category.findOne({
      $or: [{ name: new RegExp(`^${trimmedName}$`, "i") }, { slug: finalSlug }],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Category with this name or slug already exists",
      });
    }

    // ========================================
    // PRIORITY ALGORITHM
    // ========================================
    const inputPriority = priority !== undefined ? Number(priority) : 0;
    let finalPriority = 0;

    if (inputPriority > 0) {
      // Shift up all existing categories with priority >= inputPriority
      await Category.updateMany({ priority: { $gte: inputPriority } }, { $inc: { priority: 1 } });
      finalPriority = inputPriority;
    } else {
      // Auto-assign: maxPriority + 1
      const maxCategory = await Category.findOne().sort("-priority");
      finalPriority = maxCategory && maxCategory.priority ? maxCategory.priority + 1 : 1;
    }

    const category = await Category.create({
      name: trimmedName,
      slug: finalSlug,
      priority: finalPriority,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("CREATE CATEGORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create category",
    });
  }
};

// ========================================
// GET ALL CATEGORIES (ADMIN)
// ========================================
const getAllCategories = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const queryFilter = {};

    if (req.query.search) {
      queryFilter.name = { $regex: req.query.search, $options: "i" };
    }

    if (req.query.isActive !== undefined) {
      queryFilter.isActive = req.query.isActive === "true";
    }

    const categories = await Category.find(queryFilter)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
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

    const total = await Category.countDocuments(queryFilter);

    return res.json({
      success: true,
      total,
      count: formattedCategories.length,
      page,
      pages: Math.ceil(total / limit),
      data: formattedCategories,
      categories: formattedCategories,
    });
  } catch (error) {
    console.error("GET ALL CATEGORIES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

// ========================================
// GET CATEGORY BY ID (ADMIN)
// ========================================
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).lean();

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
// UPDATE CATEGORY (ADMIN)
// ========================================
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, priority, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const oldName = category.name;
    const oldSlug = category.slug;

    if (name) {
      const trimmedName = String(name).trim();

      // Check name conflict with other category
      const conflict = await Category.findOne({
        _id: { $ne: id },
        name: new RegExp(`^${trimmedName}$`, "i"),
      });

      if (conflict) {
        return res.status(400).json({
          success: false,
          message: "Another category already exists with this name",
        });
      }

      category.name = trimmedName;
    }

    // ========================================
    // PRIORITY ALGORITHM FOR UPDATE
    // ========================================
    if (priority !== undefined) {
      const newPriority = Number(priority) || 0;
      const oldPriority = category.priority || 0;

      if (newPriority !== oldPriority) {
        // Step 1: Remove category from its old slot by shifting down priorities above oldPriority
        if (oldPriority > 0) {
          await Category.updateMany(
            { _id: { $ne: category._id }, priority: { $gt: oldPriority } },
            { $inc: { priority: -1 } }
          );
        }

        // Step 2: Insert category into its new slot
        if (newPriority > 0) {
          // Shift up all priorities >= newPriority
          await Category.updateMany(
            { _id: { $ne: category._id }, priority: { $gte: newPriority } },
            { $inc: { priority: 1 } }
          );
          category.priority = newPriority;
        } else {
          // Auto-assign: put at the bottom
          const maxCategory = await Category.findOne({ _id: { $ne: category._id } }).sort("-priority");
          category.priority = maxCategory && maxCategory.priority ? maxCategory.priority + 1 : 1;
        }
      }
    }

    if (isActive !== undefined) {
      category.isActive = Boolean(isActive);
    }

    await category.save();

    // Sync updated category name/slug across all attached content (Movie, Series, ShortDrama)
    if (oldName !== category.name || oldSlug !== category.slug) {
      await syncContentCategories(oldName, oldSlug, category.name, category.slug);
    }

    return res.json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("UPDATE CATEGORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update category",
    });
  }
};

// ========================================
// DELETE CATEGORY (ADMIN)
// ========================================
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const oldName = category.name;
    const oldSlug = category.slug;

    // Capture priority before deletion to shift other priorities
    const targetPriority = category.priority || 0;

    await Category.findByIdAndDelete(req.params.id);

    // Shift down priorities of all categories with priority > targetPriority
    if (targetPriority > 0) {
      await Category.updateMany({ priority: { $gt: targetPriority } }, { $inc: { priority: -1 } });
    }

    // Remove deleted category from attached content (Movie, Series, ShortDrama)
    await removeCategoryFromContent(oldName, oldSlug);

    return res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("DELETE CATEGORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
    });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
