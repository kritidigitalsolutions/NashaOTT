const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    priority: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate the slug only when a category is created. Content records use the
// slug as their category reference, so changing it on a rename would detach
// existing movies, series, and dramas from this category.
categorySchema.pre("save", function () {
  if (this.isNew && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
});

categorySchema.index({ priority: -1, createdAt: -1 });

module.exports = mongoose.model("Category", categorySchema);
