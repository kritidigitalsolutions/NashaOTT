const Category = require("../../models/category.model");

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

    const total = await Category.countDocuments(queryFilter);

    return res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      categories,
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

    if (name) {
      const trimmedName = String(name).trim();
      const newSlug = slug ? generateSlug(slug) : generateSlug(trimmedName);

      // Check name/slug conflict with other category
      const conflict = await Category.findOne({
        _id: { $ne: id },
        $or: [{ name: new RegExp(`^${trimmedName}$`, "i") }, { slug: newSlug }],
      });

      if (conflict) {
        return res.status(400).json({
          success: false,
          message: "Another category already exists with this name or slug",
        });
      }

      category.name = trimmedName;
      category.slug = newSlug;
    } else if (slug) {
      const newSlug = generateSlug(slug);
      const conflict = await Category.findOne({ _id: { $ne: id }, slug: newSlug });
      if (conflict) {
        return res.status(400).json({
          success: false,
          message: "Another category already exists with this slug",
        });
      }
      category.slug = newSlug;
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

    // Capture priority before deletion to shift other priorities
    const targetPriority = category.priority || 0;

    await Category.findByIdAndDelete(req.params.id);

    // Shift down priorities of all categories with priority > targetPriority
    if (targetPriority > 0) {
      await Category.updateMany({ priority: { $gt: targetPriority } }, { $inc: { priority: -1 } });
    }

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
