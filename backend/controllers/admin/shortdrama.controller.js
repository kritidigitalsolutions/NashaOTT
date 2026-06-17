const ShortDrama = require(
  "../../models/shortdrama.model"
);

const DramaEpisode = require(
  "../../models/dramaEpisode.model"
);

const { getMediaUrl, deleteMedia } = require("../../utils/mediaUrl");
const { parseBoolean, getAdultContentWarning } = require("../../utils/boolean");


// PARSE JSON
const parseJSON = (
  value,
  defaultValue = []
) => {
  try {
    return value
      ? JSON.parse(value)
      : defaultValue;
  } catch {
    return defaultValue;
  }
};

const sanitizeCast = (cast = []) => {
  if (!Array.isArray(cast)) {
    return [];
  }
  return cast
    .map((member) => ({
      name: String(member?.name || "").trim(),
      image: String(member?.image || "").trim(),
    }))
    .filter((member) => member.name || member.image)
    .map((member) => ({
      ...member,
      name: member.name || "Unknown",
    }));
};

const normalizeDateInput = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    value === "null" ||
    value === "undefined"
  ) {
    return null;
  }
  return value;
};


// ADD SHORT DRAMA
const addShortDrama = async (
  req,
  res
) => {
  try {

    const genre = parseJSON(
      req.body.genre
    );

    const category = parseJSON(
      req.body.category
    );

    const cast = parseJSON(
      req.body.cast
    );

    const poster =
      req.files?.poster?.[0];

    const banner =
      req.files?.banner?.[0];

    const trailer =
      req.files?.trailer?.[0];

    // CAST IMAGES
    const castFiles = Object.keys(
      req.files || {}
    ).filter((key) =>
      key.startsWith("castImage_")
    );

    castFiles.forEach((key) => {

      const index =
        key.split("_")[1];

      const file =
        req.files[key][0];

      if (cast[index]) {
        cast[index].image =
          getMediaUrl(file);
      }
    });

    // PRIORITY ALGORITHM
    const inputPriority = req.body.priority !== undefined ? Number(req.body.priority) : 0;
    let priority = 0;

    if (inputPriority > 0) {
      await ShortDrama.updateMany({ priority: { $gte: inputPriority } }, { $inc: { priority: 1 } });
      priority = inputPriority;
    } else {
      const maxDrama = await ShortDrama.findOne().sort("-priority");
      priority = maxDrama && maxDrama.priority ? maxDrama.priority + 1 : 1;
    }

    const shortDrama =
      await ShortDrama.create({

        title: req.body.title,

        description:
          req.body.description || "",

        genre,

        language:
          req.body.language || "",

        poster: getMediaUrl(
          poster,
          req.body.poster
        ),

        banner: getMediaUrl(
          banner,
          req.body.banner
        ),

        trailerUrl: getMediaUrl(
          trailer,
          req.body.trailerUrl
        ),

        isPremium:
          parseBoolean(req.body.isPremium),

        is18Plus:
          parseBoolean(req.body.is18Plus),

        isComingSoon:
          req.body.isComingSoon === "true",

        releaseDate:
          normalizeDateInput(req.body.releaseDate),

        releaseYear:
          req.body.releaseYear || null,

        rating:
          req.body.rating || 0,

        priority,

        status:
          req.body.status ||
          "ongoing",

        cast: sanitizeCast(cast),

        category,
      });

    return res.status(201).json({
      success: true,
      message:
        "Short drama added successfully",
      warning: getAdultContentWarning(shortDrama.is18Plus),
      shortDrama,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to add short drama",
      error: error.message,
    });
  }
};


// GET ALL SHORT DRAMAS
const getAllShortDramas =
  async (req, res) => {
    try {

      const dramas =
        await ShortDrama.find()
          .sort({
            createdAt: -1,
          });

      return res.json({
        success: true,
        dramas,
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch dramas",
      });
    }
  };


// GET SINGLE SHORT DRAMA
const getShortDramaById =
  async (req, res) => {
    try {

      const shortDrama =
        await ShortDrama.findById(
          req.params.id
        );

      if (!shortDrama) {
        return res.status(404).json({
          success: false,
          message:
            "Short drama not found",
        });
      }

      return res.json({
        success: true,
        shortDrama,
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch short drama",
      });
    }
  };


// UPDATE SHORT DRAMA
const updateShortDrama =
  async (req, res) => {
    try {

      const drama =
        await ShortDrama.findById(
          req.params.id
        );

      if (!drama) {
        return res.status(404).json({
          success: false,
          message:
            "Short drama not found",
        });
      }

      const genre = parseJSON(
        req.body.genre,
        drama.genre
      );

      const category = parseJSON(
        req.body.category,
        drama.category
      );

      const cast = parseJSON(
        req.body.cast,
        drama.cast
      );

      if (req.body.title)
        drama.title =
          req.body.title;

      if (req.body.description)
        drama.description =
          req.body.description;

      if (req.body.language)
        drama.language =
          req.body.language;

      drama.genre = genre;

      drama.category = category;

      drama.isPremium =
        parseBoolean(req.body.isPremium);

      if (req.body.is18Plus !== undefined) {
        drama.is18Plus =
          parseBoolean(req.body.is18Plus);
      }

      drama.isComingSoon =
        req.body.isComingSoon === "true";

      if (req.body.releaseDate !== undefined) {
        drama.releaseDate = normalizeDateInput(req.body.releaseDate);
      }
      if (!drama.isComingSoon && req.body.releaseDate === undefined) {
        drama.releaseDate = null;
      }

      if (req.body.releaseYear !== undefined)
        drama.releaseYear = req.body.releaseYear;

      if (req.body.rating !== undefined)
        drama.rating = req.body.rating;

      drama.status =
        req.body.status ||
        drama.status;


      // POSTER
      if (req.files?.poster?.[0]) {
        await deleteMedia(drama.poster);
        drama.poster =
          getMediaUrl(req.files.poster[0]);
      } else if (req.body.posterUrl !== undefined) {
        drama.poster = req.body.posterUrl;
      } else if (req.body.poster !== undefined) {
        drama.poster = req.body.poster;
      }

      // BANNER
      if (req.files?.banner?.[0]) {
        await deleteMedia(drama.banner);
        drama.banner =
          getMediaUrl(req.files.banner[0]);
      } else if (req.body.bannerUrl !== undefined) {
        drama.banner = req.body.bannerUrl;
      } else if (req.body.banner !== undefined) {
        drama.banner = req.body.banner;
      }


      // TRAILER
      if (req.files?.trailer?.[0]) {
        await deleteMedia(
          drama.trailerUrl
        );

        drama.trailerUrl =
          getMediaUrl(req.files.trailer[0]);
      } else if (req.body.trailerUrl !== undefined) {
        drama.trailerUrl = req.body.trailerUrl;
      }

      // CAST
      const castFiles =
        Object.keys(
          req.files || {}
        ).filter((key) =>
          key.startsWith(
            "castImage_"
          )
        );

      for (const key of castFiles) {

        const index =
          key.split("_")[1];

        const file =
          req.files[key][0];

        if (cast[index]) {
          if (
            cast[index].image &&
            cast[index].image !== getMediaUrl(file)
          ) {
            await deleteMedia(cast[index].image);
          }
          cast[index].image =
            getMediaUrl(file);
        }
      }

      drama.cast = sanitizeCast(cast);

      // PRIORITY ALGORITHM FOR UPDATE
      if (req.body.priority !== undefined) {
        const newPriority = Number(req.body.priority) || 0;
        const oldPriority = drama.priority || 0;

        if (newPriority !== oldPriority) {
          if (oldPriority > 0) {
            await ShortDrama.updateMany(
              { _id: { $ne: drama._id }, priority: { $gt: oldPriority } },
              { $inc: { priority: -1 } }
            );
          }
          if (newPriority > 0) {
            await ShortDrama.updateMany(
              { _id: { $ne: drama._id }, priority: { $gte: newPriority } },
              { $inc: { priority: 1 } }
            );
            drama.priority = newPriority;
          } else {
            drama.priority = 0;
          }
        }
      }

      await drama.save();

      return res.json({
        success: true,
        message:
          "Short drama updated successfully",
        warning: getAdultContentWarning(drama.is18Plus),
        drama,
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message:
          "Failed to update short drama",
      });
    }
  };


// DELETE SHORT DRAMA
const deleteShortDrama =
  async (req, res) => {
    try {

      const drama =
        await ShortDrama.findById(
          req.params.id
        );

      if (!drama) {
        return res.status(404).json({
          success: false,
          message:
            "Short drama not found",
        });
      }

      deleteMedia(drama.poster);

      deleteMedia(drama.banner);

      deleteMedia(
        drama.trailerUrl
      );

      drama.cast.forEach((c) =>
        deleteMedia(c.image)
      );


      // DELETE EPISODES
      const episodes =
        await DramaEpisode.find({
          shortDramaId:
            drama._id,
        });

      episodes.forEach((ep) => {
        deleteMedia(ep.videoUrl);
        deleteMedia(ep.thumbnail);
      });

      await DramaEpisode.deleteMany({
        shortDramaId:
          drama._id,
      });

      await ShortDrama.findByIdAndDelete(
        req.params.id
      );

      return res.json({
        success: true,
        message:
          "Short drama deleted successfully",
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete short drama",
      });
    }
  };


// SEARCH
const searchShortDrama =
  async (req, res) => {
    try {

      const { q } = req.query;

      const dramas =
        await ShortDrama.find({
          title: {
            $regex: q,
            $options: "i",
          },
        });

      return res.json({
        success: true,
        results: dramas,
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message:
          "Search failed",
      });
    }
  };


module.exports = {
  addShortDrama,
  getAllShortDramas,
  getShortDramaById,
  updateShortDrama,
  deleteShortDrama,
  searchShortDrama,
};
