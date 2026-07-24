/**
 * Migration Script: Reassign sequential priorities to all existing categories
 * 
 * This script reads all categories sorted by their current priority (descending)
 * and creation date, then assigns sequential priorities 1, 2, 3... 
 * 
 * Priority 1 = highest (shown first)
 * 
 * Run: node backend/scripts/migrate-category-priority.js
 */

const mongoose = require("mongoose");
const path = require("path");

// Load env
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const Category = require("../models/category.model");

const migrateCategoryPriority = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI?.trim(), {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ Connected to MongoDB");

    // Get all categories sorted by current priority desc, then createdAt desc
    const categories = await Category.find({})
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    if (categories.length === 0) {
      console.log("ℹ️ No categories found to migrate.");
      await mongoose.disconnect();
      return;
    }

    console.log(`📦 Found ${categories.length} categories to reorder`);

    let updated = 0;
    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      const newPriority = i + 1; // 1-based sequential

      if (cat.priority !== newPriority) {
        await Category.findByIdAndUpdate(cat._id, { priority: newPriority });
        console.log(`  ✓ "${cat.name}" → priority ${newPriority} (was ${cat.priority})`);
        updated++;
      } else {
        console.log(`  - "${cat.name}" → priority ${newPriority} (unchanged)`);
      }
    }

    console.log(`\n✅ Migration complete! ${updated} categories updated.`);
    console.log(`   Priorities now range from 1 (highest) to ${categories.length} (lowest).`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
};

migrateCategoryPriority();

