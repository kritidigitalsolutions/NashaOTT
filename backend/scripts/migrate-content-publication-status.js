/**
 * Adds an explicit publication status to content created before isPublished
 * was introduced. Existing content remains visible by being marked published.
 *
 * Run: node scripts/migrate-content-publication-status.js
 */
const path = require("path");
const mongoose = require("mongoose");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const connectDB = require("../config/db");
const Movie = require("../models/movie.model");
const Series = require("../models/series.model");

const migratePublicationStatus = async () => {
  try {
    await connectDB();

    const [movies, series] = await Promise.all([
      Movie.updateMany(
        { isPublished: { $exists: false } },
        { $set: { isPublished: true } }
      ),
      Series.updateMany(
        { isPublished: { $exists: false } },
        { $set: { isPublished: true } }
      ),
    ]);

    console.log(`Movies updated: ${movies.modifiedCount}`);
    console.log(`Series updated: ${series.modifiedCount}`);
  } catch (error) {
    console.error("Publication-status migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

migratePublicationStatus();
