const mongoose = require("mongoose");
const DramaEpisode = require("./dramaEpisode.model");

const castSchema =
  new mongoose.Schema({
    name: String,
    image: String,
  });

const shortDramaSchema =
  new mongoose.Schema(
    {
      title: {
        type: String,
        required: true,
      },

      slug: {
        type: String,
        unique: true,
        index: true,
      },

      description: String,

      genre: [String],

      language: String,

      poster: String,

      banner: String,

      trailerUrl: String,

      totalEpisodes: {
        type: Number,
        default: 0,
      },

      totalViews: {
        type: Number,
        default: 0,
      },

      isPremium: {
        type: Boolean,
        default: false,
      },

      is18Plus: {
        type: Boolean,
        default: false,
      },

      priority: {
        type: Number,
        default: 0,
      },

      rating: {
        type: Number,
        min: 0,
        max: 10,
        default: 0,
      },

      releaseYear: Number,

      isComingSoon: {
        type: Boolean,
        default: false,
      },

      releaseDate: { type: Date },

      status: {
        type: String,
        enum: [
          "ongoing",
          "completed",
        ],
        default: "ongoing",
      },

      cast: [castSchema],

      category: [{ type: String }],
    },
    {
      timestamps: true,
    }
  );


// Auto slug
shortDramaSchema.pre(
  "save",
  function () {
    if (this.title) {
      this.slug =
        this.title
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]+/g, "") +
        "-" +
        Date.now();
    }
  }
);

shortDramaSchema.pre(
  "findOneAndDelete",
  async function () {
    const drama = await this.model.findOne(this.getFilter()).select("_id");

    if (drama) {
      await DramaEpisode.deleteMany({
        shortDramaId: drama._id,
      });
    }
  }
);

shortDramaSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function () {
    await DramaEpisode.deleteMany({
      shortDramaId: this._id,
    });
  }
);

shortDramaSchema.index({ createdAt: -1 });

module.exports = mongoose.model(
  "ShortDrama",
  shortDramaSchema
);
