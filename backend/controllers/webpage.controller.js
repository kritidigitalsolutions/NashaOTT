const WebpageConfig = require("../models/webpageConfig.model");
const Movie = require("../models/movie.model");
const Series = require("../models/series.model");
const Episode = require("../models/episode.model");

// ============================================================
// POPULATE HELPER
// Mongoose cannot reliably use refPath inside nested array
// subdocuments, so we populate manually using the contentType
// field to determine which model to use for each item.
// ============================================================
const populateConfig = async (config) => {
  if (!config) return config;

  // Separate banner IDs by type
  const bannerMovieIds = [];
  const bannerSeriesIds = [];
  for (const b of config.heroBanners) {
    if (b.contentType === "Movie") bannerMovieIds.push(b.contentId.toString());
    else if (b.contentType === "Series") bannerSeriesIds.push(b.contentId.toString());
  }

  // Separate section item IDs by type
  const secMovieIds = [];
  const secSeriesIds = [];
  for (const sec of config.sections) {
    for (const item of sec.items) {
      if (item.contentType === "Movie") secMovieIds.push(item.contentId.toString());
      else if (item.contentType === "Series") secSeriesIds.push(item.contentId.toString());
    }
  }

  const allMovieIds = [...new Set([...bannerMovieIds, ...secMovieIds])];
  const allSeriesIds = [...new Set([...bannerSeriesIds, ...secSeriesIds])];

  const SELECT = "title description releaseYear duration language poster banner isComingSoon isPublished isHide is18Plus releaseDate priority rating videoUrl trailerUrl isPremium contentType";
  const ADMIN_SELECT = "title poster banner isPremium isPublished isHide releaseDate priority rating is18Plus";

  const [movies, seriesList] = await Promise.all([
    allMovieIds.length ? Movie.find({ _id: { $in: allMovieIds } }).select(SELECT).lean() : [],
    allSeriesIds.length ? Series.find({ _id: { $in: allSeriesIds } }).select(SELECT).lean() : []
  ]);

  const movieMap = {};
  for (const m of movies) movieMap[m._id.toString()] = { ...m, contentType: "movie" };
  const seriesMap = {};
  for (const s of seriesList) seriesMap[s._id.toString()] = { ...s, contentType: "series" };

  return { movieMap, seriesMap };
};

const populateConfigAdmin = async (config) => {
  if (!config) return config;

  const bannerMovieIds = [];
  const bannerSeriesIds = [];
  for (const b of config.heroBanners) {
    if (b.contentType === "Movie") bannerMovieIds.push(b.contentId.toString());
    else if (b.contentType === "Series") bannerSeriesIds.push(b.contentId.toString());
  }

  const secMovieIds = [];
  const secSeriesIds = [];
  for (const sec of config.sections) {
    for (const item of sec.items) {
      if (item.contentType === "Movie") secMovieIds.push(item.contentId.toString());
      else if (item.contentType === "Series") secSeriesIds.push(item.contentId.toString());
    }
  }

  const allMovieIds = [...new Set([...bannerMovieIds, ...secMovieIds])];
  const allSeriesIds = [...new Set([...bannerSeriesIds, ...secSeriesIds])];

  const ADMIN_SELECT = "title poster banner isPremium isPublished isHide releaseDate priority rating is18Plus";

  const [movies, seriesList] = await Promise.all([
    allMovieIds.length ? Movie.find({ _id: { $in: allMovieIds } }).select(ADMIN_SELECT).lean() : [],
    allSeriesIds.length ? Series.find({ _id: { $in: allSeriesIds } }).select(ADMIN_SELECT).lean() : []
  ]);

  const movieMap = {};
  for (const m of movies) movieMap[m._id.toString()] = m;
  const seriesMap = {};
  for (const s of seriesList) seriesMap[s._id.toString()] = s;

  // Build populated config object
  const populated = {
    ...config.toObject(),
    heroBanners: config.heroBanners.map(b => {
      const id = b.contentId.toString();
      const content = b.contentType === "Movie" ? movieMap[id] : seriesMap[id];
      return { ...b.toObject(), contentId: content || b.contentId };
    }),
    sections: config.sections.map(sec => ({
      ...sec.toObject(),
      items: sec.items.map(item => {
        const id = item.contentId.toString();
        const content = item.contentType === "Movie" ? movieMap[id] : seriesMap[id];
        return { ...item.toObject(), contentId: content || item.contentId };
      })
    }))
  };
  return populated;
};

// ============================================================
// Helpers
// ============================================================
const isVisible = item =>
  item && item.title && item.isPublished !== false && item.isHide !== true && item.is18Plus !== true;

const attachEpisodesToSeries = async (heroBanners, sections) => {
  const seriesIds = [];
  if (heroBanners) {
    for (const b of heroBanners) {
      if (b.type === "series" && b._id) seriesIds.push(b._id.toString());
    }
  }
  if (sections) {
    for (const sec of sections) {
      if (sec.items) {
        for (const item of sec.items) {
          if (item.type === "series" && item._id) seriesIds.push(item._id.toString());
        }
      }
    }
  }
  if (seriesIds.length === 0) return;

  const episodes = await Episode.find({ seriesId: { $in: seriesIds } })
    .sort({ seasonNumber: 1, episodeNumber: 1 })
    .lean();

  const grouped = {};
  for (const ep of episodes) {
    const sId = ep.seriesId.toString();
    if (!grouped[sId]) grouped[sId] = {};
    const sNum = ep.seasonNumber;
    if (!grouped[sId][sNum]) grouped[sId][sNum] = [];
    grouped[sId][sNum].push(ep);
  }

  const seriesSeasons = {};
  for (const sId of Object.keys(grouped)) {
    const seasons = [];
    const nums = Object.keys(grouped[sId]).map(Number).sort((a, b) => a - b);
    for (const num of nums) {
      seasons.push({ seasonNumber: num, episodes: grouped[sId][num] });
    }
    seriesSeasons[sId] = seasons;
  }

  if (heroBanners) {
    for (const b of heroBanners) {
      if (b.type === "series" && b._id) b.seasons = seriesSeasons[b._id.toString()] || [];
    }
  }
  if (sections) {
    for (const sec of sections) {
      if (sec.items) {
        for (const item of sec.items) {
          if (item.type === "series" && item._id) item.seasons = seriesSeasons[item._id.toString()] || [];
        }
      }
    }
  }
};

// ============================================================
// GET FULL WEBPAGE LAYOUT
// GET /api/webpage/layout
// ============================================================
const getWebpageLayout = async (req, res) => {
  try {
    const config = await WebpageConfig.findOne().lean();

    if (!config || (config.heroBanners?.length === 0 && config.sections?.length === 0)) {
      return res.json({
        success: true,
        isCustomLayout: false,
        heroBanners: [],
        sections: [],
        movieCount: 0,
        seriesCount: 0,
        message: "No curated layout configured yet."
      });
    }

    // Gather all IDs
    const bannerMovieIds = [], bannerSeriesIds = [], secMovieIds = [], secSeriesIds = [];
    for (const b of config.heroBanners) {
      if (b.contentType === "Movie") bannerMovieIds.push(b.contentId.toString());
      else if (b.contentType === "Series") bannerSeriesIds.push(b.contentId.toString());
    }
    for (const sec of config.sections) {
      for (const item of sec.items) {
        if (item.contentType === "Movie") secMovieIds.push(item.contentId.toString());
        else if (item.contentType === "Series") secSeriesIds.push(item.contentId.toString());
      }
    }

    const allMovieIds = [...new Set([...bannerMovieIds, ...secMovieIds])];
    const allSeriesIds = [...new Set([...bannerSeriesIds, ...secSeriesIds])];

    const SELECT = "title description releaseYear duration language poster banner isComingSoon isPublished isHide is18Plus releaseDate priority rating videoUrl trailerUrl isPremium";

    const [movies, seriesList] = await Promise.all([
      allMovieIds.length ? Movie.find({ _id: { $in: allMovieIds } }).select(SELECT).lean() : [],
      allSeriesIds.length ? Series.find({ _id: { $in: allSeriesIds } }).select(SELECT).lean() : []
    ]);

    const movieMap = {};
    for (const m of movies) movieMap[m._id.toString()] = m;
    const seriesMap = {};
    for (const s of seriesList) seriesMap[s._id.toString()] = s;

    const heroBanners = config.heroBanners
      .map(b => {
        const id = b.contentId.toString();
        const content = b.contentType === "Movie" ? movieMap[id] : seriesMap[id];
        if (!isVisible(content)) return null;
        return { ...content, type: b.contentType.toLowerCase() };
      })
      .filter(Boolean);

    const sections = config.sections
      .map(sec => ({
        categorySlug: sec.categorySlug,
        title: sec.title,
        items: sec.items
          .map(i => {
            const id = i.contentId.toString();
            const content = i.contentType === "Movie" ? movieMap[id] : seriesMap[id];
            if (!isVisible(content)) return null;
            return { ...content, type: i.contentType.toLowerCase() };
          })
          .filter(Boolean)
      }))
      .filter(sec => sec.items.length > 0);

    await attachEpisodesToSeries(heroBanners, sections);

    let movieCount = 0, seriesCount = 0;
    heroBanners.forEach(b => { if (b.type === "movie") movieCount++; else if (b.type === "series") seriesCount++; });
    sections.forEach(sec => { sec.items.forEach(item => { if (item.type === "movie") movieCount++; else if (item.type === "series") seriesCount++; }); });

    return res.json({
      success: true,
      isCustomLayout: true,
      movieCount,
      seriesCount,
      bannersCount: heroBanners.length,
      sectionsCount: sections.length,
      heroBanners,
      sections
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET HERO BANNERS ONLY
// GET /api/webpage/banners
// ============================================================
const getHeroBanners = async (req, res) => {
  try {
    const config = await WebpageConfig.findOne().lean();

    if (!config || !config.heroBanners?.length) {
      return res.json({ success: true, heroBanners: [], movieCount: 0, seriesCount: 0, bannersCount: 0 });
    }

    const movieIds = [], seriesIds = [];
    for (const b of config.heroBanners) {
      if (b.contentType === "Movie") movieIds.push(b.contentId.toString());
      else if (b.contentType === "Series") seriesIds.push(b.contentId.toString());
    }

    const SELECT = "title description releaseYear duration language poster banner isComingSoon isPublished isHide is18Plus releaseDate rating videoUrl trailerUrl isPremium";

    const [movies, seriesList] = await Promise.all([
      movieIds.length ? Movie.find({ _id: { $in: movieIds } }).select(SELECT).lean() : [],
      seriesIds.length ? Series.find({ _id: { $in: seriesIds } }).select(SELECT).lean() : []
    ]);

    const movieMap = {};
    for (const m of movies) movieMap[m._id.toString()] = m;
    const seriesMap = {};
    for (const s of seriesList) seriesMap[s._id.toString()] = s;

    const heroBanners = config.heroBanners
      .map(b => {
        const id = b.contentId.toString();
        const content = b.contentType === "Movie" ? movieMap[id] : seriesMap[id];
        if (!isVisible(content)) return null;
        return { ...content, type: b.contentType.toLowerCase() };
      })
      .filter(Boolean);

    await attachEpisodesToSeries(heroBanners, null);

    let movieCount = 0, seriesCount = 0;
    heroBanners.forEach(b => { if (b.type === "movie") movieCount++; else if (b.type === "series") seriesCount++; });

    return res.json({ success: true, movieCount, seriesCount, bannersCount: heroBanners.length, heroBanners });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET ALL CAROUSEL SECTIONS
// GET /api/webpage/sections
// ============================================================
const getSections = async (req, res) => {
  try {
    const config = await WebpageConfig.findOne().lean();

    if (!config || !config.sections?.length) {
      return res.json({ success: true, sections: [], movieCount: 0, seriesCount: 0, sectionsCount: 0 });
    }

    const movieIds = [], seriesIds = [];
    for (const sec of config.sections) {
      for (const item of sec.items) {
        if (item.contentType === "Movie") movieIds.push(item.contentId.toString());
        else if (item.contentType === "Series") seriesIds.push(item.contentId.toString());
      }
    }

    const SELECT = "title description releaseYear duration language poster banner isComingSoon isPublished isHide is18Plus releaseDate rating videoUrl trailerUrl isPremium";

    const [movies, seriesList] = await Promise.all([
      movieIds.length ? Movie.find({ _id: { $in: [...new Set(movieIds)] } }).select(SELECT).lean() : [],
      seriesIds.length ? Series.find({ _id: { $in: [...new Set(seriesIds)] } }).select(SELECT).lean() : []
    ]);

    const movieMap = {};
    for (const m of movies) movieMap[m._id.toString()] = m;
    const seriesMap = {};
    for (const s of seriesList) seriesMap[s._id.toString()] = s;

    const sections = config.sections
      .map(sec => ({
        categorySlug: sec.categorySlug,
        title: sec.title,
        items: sec.items
          .map(i => {
            const id = i.contentId.toString();
            const content = i.contentType === "Movie" ? movieMap[id] : seriesMap[id];
            if (!isVisible(content)) return null;
            return { ...content, type: i.contentType.toLowerCase() };
          })
          .filter(Boolean)
      }))
      .filter(sec => sec.items.length > 0);

    await attachEpisodesToSeries(null, sections);

    let movieCount = 0, seriesCount = 0;
    sections.forEach(sec => { sec.items.forEach(item => { if (item.type === "movie") movieCount++; else if (item.type === "series") seriesCount++; }); });

    return res.json({ success: true, movieCount, seriesCount, sectionsCount: sections.length, sections });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET SINGLE SECTION BY SLUG
// GET /api/webpage/sections/:slug
// ============================================================
const getSectionBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const config = await WebpageConfig.findOne().lean();

    if (!config) return res.status(404).json({ success: false, message: "No layout configured." });

    const sec = config.sections.find(s => s.categorySlug === slug);
    if (!sec) return res.status(404).json({ success: false, message: `Section '${slug}' not found.` });

    const movieIds = [], seriesIds = [];
    for (const item of sec.items) {
      if (item.contentType === "Movie") movieIds.push(item.contentId.toString());
      else if (item.contentType === "Series") seriesIds.push(item.contentId.toString());
    }

    const SELECT = "title description releaseYear duration language poster banner isComingSoon isPublished isHide is18Plus releaseDate rating videoUrl trailerUrl isPremium";

    const [movies, seriesList] = await Promise.all([
      movieIds.length ? Movie.find({ _id: { $in: movieIds } }).select(SELECT).lean() : [],
      seriesIds.length ? Series.find({ _id: { $in: seriesIds } }).select(SELECT).lean() : []
    ]);

    const movieMap = {};
    for (const m of movies) movieMap[m._id.toString()] = m;
    const seriesMap = {};
    for (const s of seriesList) seriesMap[s._id.toString()] = s;

    const items = sec.items
      .map(i => {
        const id = i.contentId.toString();
        const content = i.contentType === "Movie" ? movieMap[id] : seriesMap[id];
        if (!isVisible(content)) return null;
        return { ...content, type: i.contentType.toLowerCase() };
      })
      .filter(Boolean);

    const section = { categorySlug: sec.categorySlug, title: sec.title, items };
    await attachEpisodesToSeries(null, [section]);

    let movieCount = 0, seriesCount = 0;
    items.forEach(item => { if (item.type === "movie") movieCount++; else if (item.type === "series") seriesCount++; });

    return res.json({ success: true, movieCount, seriesCount, section });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET SINGLE CONTENT ITEM BY ID + TYPE
// GET /api/webpage/content/:id
// ============================================================
const getWebpageContentById = async (req, res) => {
  try {
    const { id } = req.params;

    let item = await Movie.findById(id).lean();
    let type = "movie";
    if (!item) {
      item = await Series.findById(id).lean();
      type = "series";
    }

    if (!item) return res.status(404).json({ success: false, message: "Content not found." });
    if (item.isPublished === false || item.isHide === true || item.is18Plus === true) {
      return res.status(403).json({ success: false, message: "Content is not available." });
    }

    return res.json({ success: true, content: { ...item, type } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getWebpageLayout,
  getHeroBanners,
  getSections,
  getSectionBySlug,
  getWebpageContentById,
  populateConfigAdmin
};
