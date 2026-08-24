const WebpageConfig = require("../../models/webpageConfig.model");
const Movie = require("../../models/movie.model");
const Series = require("../../models/series.model");

// ============================================================
// Helper: manually populate a config document for admin use
// ============================================================
const manualPopulate = async (config, select) => {
  const movieIds = [], seriesIds = [];
  for (const b of config.heroBanners) {
    if (b.contentType === "Movie") movieIds.push(b.contentId.toString());
    else if (b.contentType === "Series") seriesIds.push(b.contentId.toString());
  }
  for (const sec of config.sections) {
    for (const item of sec.items) {
      if (item.contentType === "Movie") movieIds.push(item.contentId.toString());
      else if (item.contentType === "Series") seriesIds.push(item.contentId.toString());
    }
  }

  const allMovieIds = [...new Set(movieIds)];
  const allSeriesIds = [...new Set(seriesIds)];

  const [movies, seriesList] = await Promise.all([
    allMovieIds.length ? Movie.find({ _id: { $in: allMovieIds } }).select(select).lean() : [],
    allSeriesIds.length ? Series.find({ _id: { $in: allSeriesIds } }).select(select).lean() : []
  ]);

  const movieMap = {};
  for (const m of movies) movieMap[m._id.toString()] = m;
  const seriesMap = {};
  for (const s of seriesList) seriesMap[s._id.toString()] = s;

  return {
    ...config.toObject(),
    heroBanners: config.heroBanners.map(b => {
      const id = b.contentId.toString();
      const content = b.contentType === "Movie" ? movieMap[id] : seriesMap[id];
      return { ...b.toObject(), contentId: content || null };
    }),
    sections: config.sections.map(sec => ({
      ...sec.toObject(),
      items: sec.items.map(item => {
        const id = item.contentId.toString();
        const content = item.contentType === "Movie" ? movieMap[id] : seriesMap[id];
        return { ...item.toObject(), contentId: content || null };
      })
    }))
  };
};

const ADMIN_SELECT = "title poster banner isPremium isPublished isHide releaseDate priority rating is18Plus";

// ============================================================
// GET WEBPAGE CONFIG (Admin)
// GET /api/admin/webpage
// ============================================================
const getWebpageConfig = async (req, res) => {
  try {
    let config = await WebpageConfig.findOne();
    if (!config) {
      config = await WebpageConfig.create({ heroBanners: [], sections: [] });
    }

    const populated = await manualPopulate(config, ADMIN_SELECT);

    return res.json({ success: true, config: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// UPDATE WEBPAGE CONFIG (Admin)
// POST /api/admin/webpage
// ============================================================
const updateWebpageConfig = async (req, res) => {
  try {
    const { heroBanners, sections } = req.body;

    // Normalize and validate
    const normalizeType = (t) => {
      if (!t) return "Movie";
      return t.toLowerCase() === "series" ? "Series" : "Movie";
    };

    // Gather IDs for 18+ check
    const movieIds = [], seriesIds = [];
    const normalizedBanners = (heroBanners || []).map(b => {
      const type = normalizeType(b.contentType);
      const id = b.contentId?._id || b.contentId;
      if (type === "Movie") movieIds.push(id);
      else seriesIds.push(id);
      return { contentType: type, contentId: id };
    });

    const normalizedSections = (sections || []).map(s => ({
      categorySlug: s.categorySlug,
      title: s.title,
      items: (s.items || []).map(i => {
        const type = normalizeType(i.contentType);
        const id = i.contentId?._id || i.contentId;
        if (type === "Movie") movieIds.push(id);
        else seriesIds.push(id);
        return { contentType: type, contentId: id };
      })
    }));

    // Check for adult content
    const [adultMovies, adultSeries] = await Promise.all([
      movieIds.length ? Movie.find({ _id: { $in: movieIds }, is18Plus: true }).select("title") : [],
      seriesIds.length ? Series.find({ _id: { $in: seriesIds }, is18Plus: true }).select("title") : []
    ]);

    if (adultMovies.length > 0 || adultSeries.length > 0) {
      const titles = [...adultMovies.map(m => m.title), ...adultSeries.map(s => s.title)];
      return res.status(400).json({
        success: false,
        message: `Adult content cannot be added to the webpage layout. Please remove: ${titles.join(", ")}`
      });
    }

    let config = await WebpageConfig.findOne();
    if (!config) config = new WebpageConfig();

    config.heroBanners = normalizedBanners;
    config.sections = normalizedSections;
    await config.save();

    const populated = await manualPopulate(config, ADMIN_SELECT);

    return res.json({
      success: true,
      message: "Webpage layout updated successfully",
      config: populated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getWebpageConfig, updateWebpageConfig };
