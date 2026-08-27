/* eslint-disable no-unused-vars */
const Interaction = require("../models/interaction.model");
const Movie = require("../models/movie.model");
const Series = require("../models/series.model");

// ✅ LIKE / DISLIKE TOGGLE
exports.toggleInteraction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contentId, contentType, type } = req.body;

    if (!contentId || !contentType || !type) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (!["like", "dislike"].includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    if (!["movie", "series"].includes(contentType.toLowerCase())) {
      return res.status(400).json({ message: "Invalid contentType" });
    }

    const Model = contentType.toLowerCase() === "movie" ? Movie : Series;

    // 🔍 check existing
    const existing = await Interaction.findOne({
      user: userId,
      contentId
    });

    // ❌ if same type → REMOVE (toggle off)
    if (existing && existing.type === type) {
      await Interaction.deleteOne({ _id: existing._id });

      const updateField = type === "like" ? "likes" : "dislikes";
      await Model.findByIdAndUpdate(contentId, { $inc: { [updateField]: -1 } });

      return res.json({
        message: `${type} removed`
      });
    }

    // 🔁 if different type → UPDATE
    if (existing) {
      const oldType = existing.type;
      existing.type = type;
      await existing.save();

      const incObj = oldType === "like" 
        ? { likes: -1, dislikes: 1 } 
        : { likes: 1, dislikes: -1 };
      await Model.findByIdAndUpdate(contentId, { $inc: incObj });

      return res.json({
        message: `Changed to ${type}`
      });
    }

    // ✅ new interaction
    await Interaction.create({
      user: userId,
      contentId,
      contentType,
      type
    });

    const updateField = type === "like" ? "likes" : "dislikes";
    await Model.findByIdAndUpdate(contentId, { $inc: { [updateField]: 1 } });

    res.json({
      message: `${type} added`
    });

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

exports.getUserInteraction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contentId } = req.params;

    const interaction = await Interaction.findOne({
      user: userId,
      contentId
    });

    res.json({
      type: interaction ? interaction.type : null
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getInteractionStats = async (req, res) => {
  try {
    const { contentId } = req.params;

    const likes = await Interaction.countDocuments({
      contentId,
      type: "like"
    });

    const dislikes = await Interaction.countDocuments({
      contentId,
      type: "dislike"
    });

    res.json({
      likes,
      dislikes
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};