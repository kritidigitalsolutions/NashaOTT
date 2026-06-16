import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiFilm,
  FiAlignLeft,
  FiCalendar,
  FiTrendingUp,
  FiImage,
  FiYoutube,
  FiPlay,
  FiUsers,
  FiPlus,
  FiTrash2,
  FiUpload,
  FiLink,
  FiCheck,
  FiInfo,
} from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { addMovie, addSeries, addShortDrama, addEpisode, addDramaEpisode } from "../../api/adminApi";

const AVAILABLE_GENRES = [
  "Action",
  "Romance",
  "Drama",
  "Comedy",
  "Thriller",
  "Horror",
  "Sci-Fi",
  "Crime",
  "Mystery",
  "Fantasy",
  "Adventure",
  "Family",
  "Documentary",
];

const AVAILABLE_CATEGORIES = [
  "Featured",
  "Trending",
  "Popular",
  "Slider",
  "Latest",
  "Recommended",
];

const MB = 1024 * 1024;
const GB = 1024 * MB;
const SIZE_LIMITS = {
  poster: 5 * MB,
  banner: 5 * MB,
  trailer: 5 * GB,
  video: 5 * GB,
  castImage: 2 * MB,
};

export default function AddContentPage() {
  const [contentType, setContentType] = useState("movie"); // movie, series, shortdrama
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Form Fields State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [duration, setDuration] = useState("");
  const [language, setLanguage] = useState("");
  const [rating, setRating] = useState("");
  const [priority, setPriority] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [isComingSoon, setIsComingSoon] = useState(false);
  const [releaseDate, setReleaseDate] = useState("");

  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Custom genre / category inputs
  const [customGenreInput, setCustomGenreInput] = useState("");
  const [customCategoryInput, setCustomCategoryInput] = useState("");

  // Media files & direct URL states
  const [posterFile, setPosterFile] = useState(null);
  const [posterUrl, setPosterUrl] = useState("");
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerUrl, setBannerUrl] = useState("");
  const [trailerFile, setTrailerFile] = useState(null);
  const [trailerUrl, setTrailerUrl] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");

  // Cast member states
  const [cast, setCast] = useState([]);

  // Episode / Season states
  const [episodes, setEpisodes] = useState([]);        // shortdrama flat list
  const [seasons, setSeasons] = useState([]);           // series: [{seasonNumber, episodes:[]}]
  const [episodeUploadStatus, setEpisodeUploadStatus] = useState("");

  // ── Season helpers (series) ───────────────────────────────────────
  const handleAddSeason = () => {
    const nextNum = seasons.length > 0 ? seasons[seasons.length - 1].seasonNumber + 1 : 1;
    setSeasons((prev) => [...prev, { seasonNumber: nextNum, episodes: [] }]);
  };

  const handleRemoveSeason = (sIdx) => {
    setSeasons((prev) => prev.filter((_, i) => i !== sIdx));
  };

  const handleAddEpisodeToSeason = (sIdx) => {
    setSeasons((prev) => {
      const updated = [...prev];
      const ep = { episodeNumber: updated[sIdx].episodes.length + 1, title: "", duration: "", videoFile: null, videoUrl: "", thumbnailFile: null, thumbnailUrl: "" };
      updated[sIdx] = { ...updated[sIdx], episodes: [...updated[sIdx].episodes, ep] };
      return updated;
    });
  };

  const handleRemoveEpisodeFromSeason = (sIdx, eIdx) => {
    setSeasons((prev) => {
      const updated = [...prev];
      updated[sIdx] = { ...updated[sIdx], episodes: updated[sIdx].episodes.filter((_, i) => i !== eIdx) };
      return updated;
    });
  };

  const handleSeasonEpisodeChange = (sIdx, eIdx, field, value) => {
    setSeasons((prev) => {
      const updated = [...prev];
      const eps = [...updated[sIdx].episodes];
      eps[eIdx] = { ...eps[eIdx], [field]: value };
      updated[sIdx] = { ...updated[sIdx], episodes: eps };
      return updated;
    });
  };

  // ── Short-drama flat-episode helpers ─────────────────────────────
  const EMPTY_DRAMA_EP = () => ({
    episodeNumber: "",
    title: "",
    duration: "",
    isLocked: false,
    isVertical: true,
    videoFile: null,
    videoUrl: "",
    thumbnailFile: null,
    thumbnailUrl: "",
  });

  const handleAddEpisode = () => setEpisodes((prev) => [...prev, EMPTY_DRAMA_EP()]);

  const handleRemoveEpisode = (index) => setEpisodes((prev) => prev.filter((_, i) => i !== index));

  const handleEpisodeChange = (index, field, value) => {
    setEpisodes((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const validateFileSize = (file, type) => {
    if (!file) return true;
    const limit = SIZE_LIMITS[type] || 5 * MB;
    if (file.size > limit) {
      const displayLimit = limit >= GB ? `${limit / GB}GB` : `${limit / MB}MB`;
      toast.error(`File "${file.name}" exceeds the ${displayLimit} limit!`);
      return false;
    }
    return true;
  };

  const handleGenreToggle = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleCategoryToggle = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleAddCastMember = () => {
    setCast((prev) => [...prev, { name: "", imageFile: null, imageUrl: "" }]);
  };

  const handleRemoveCastMember = (index) => {
    setCast((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCastChange = (index, field, value) => {
    setCast((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  // ── Rating cap at 10 ─────────────────────────────────────────────
  const handleRatingChange = (e) => {
    const val = e.target.value;
    // Allow empty string while typing
    if (val === "") { setRating(""); return; }
    const num = parseFloat(val);
    if (!isNaN(num)) setRating(Math.min(10, Math.max(0, num)));
  };

  // ── Custom genre add ─────────────────────────────────────────────
  const handleAddCustomGenre = () => {
    const trimmed = customGenreInput.trim();
    if (!trimmed) return;
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    if (!selectedGenres.includes(formatted)) {
      setSelectedGenres((prev) => [...prev, formatted]);
    }
    setCustomGenreInput("");
  };

  // ── Custom category add ──────────────────────────────────────────
  const handleAddCustomCategory = () => {
    const trimmed = customCategoryInput.trim();
    if (!trimmed) return;
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    if (!selectedCategories.includes(formatted)) {
      setSelectedCategories((prev) => [...prev, formatted]);
    }
    setCustomCategoryInput("");
  };

  const handleResetForm = () => {
    setTitle("");
    setDescription("");
    setReleaseYear("");
    setDuration("");
    setLanguage("");
    setRating("");
    setPriority("");
    setIsPremium(false);
    setIsComingSoon(false);
    setReleaseDate("");
    setSelectedGenres([]);
    setSelectedCategories([]);
    setCustomGenreInput("");
    setCustomCategoryInput("");
    setPosterFile(null);
    setPosterUrl("");
    setBannerFile(null);
    setBannerUrl("");
    setTrailerFile(null);
    setTrailerUrl("");
    setVideoFile(null);
    setVideoUrl("");
    setCast([]);
    setEpisodes([]);
    setSeasons([]);
    setUploadProgress(0);
    setEpisodeUploadStatus("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required!");
      return;
    }

    // Client-side file size checks
    if (posterFile && !validateFileSize(posterFile, "poster")) return;
    if (bannerFile && !validateFileSize(bannerFile, "banner")) return;
    if (trailerFile && !validateFileSize(trailerFile, "trailer")) return;
    if (videoFile && !validateFileSize(videoFile, "video")) return;
    for (let i = 0; i < cast.length; i++) {
      if (cast[i].imageFile && !validateFileSize(cast[i].imageFile, "castImage")) return;
    }
    // Validate series seasons/episodes
    for (let s = 0; s < seasons.length; s++) {
      for (let e = 0; e < seasons[s].episodes.length; e++) {
        const ep = seasons[s].episodes[e];
        if (!ep.episodeNumber) {
          toast.error(`Season ${seasons[s].seasonNumber}, Episode ${e + 1}: Episode Number is required!`);
          return;
        }
        if (ep.videoFile && !validateFileSize(ep.videoFile, "video")) return;
        if (ep.thumbnailFile && !validateFileSize(ep.thumbnailFile, "poster")) return;
      }
    }
    // Validate drama episodes
    for (let i = 0; i < episodes.length; i++) {
      if (!episodes[i].episodeNumber) {
        toast.error(`Episode ${i + 1}: Episode Number is required!`);
        return;
      }
      if (episodes[i].videoFile && !validateFileSize(episodes[i].videoFile, "video")) return;
      if (episodes[i].thumbnailFile && !validateFileSize(episodes[i].thumbnailFile, "poster")) return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setEpisodeUploadStatus("");

      // ── Step 1: Upload the main content (Series / Short Drama / Movie) ──
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("releaseYear", releaseYear);
      formData.append("duration", duration);
      formData.append("language", language);
      formData.append("rating", rating || 0);
      if (priority) formData.append("priority", priority);

      formData.append("isPremium", isPremium ? "true" : "false");
      formData.append("isComingSoon", isComingSoon ? "true" : "false");
      if (isComingSoon && releaseDate) {
        formData.append("releaseDate", releaseDate);
      }

      formData.append("genre", JSON.stringify(selectedGenres));
      formData.append("category", JSON.stringify(selectedCategories));

      if (posterFile) formData.append("poster", posterFile);
      if (posterUrl) formData.append("posterUrl", posterUrl);

      if (bannerFile) formData.append("banner", bannerFile);
      if (bannerUrl) formData.append("bannerUrl", bannerUrl);

      if (trailerFile) formData.append("trailer", trailerFile);
      if (trailerUrl) formData.append("trailerUrl", trailerUrl);

      if (contentType === "movie") {
        if (videoFile) formData.append("video", videoFile);
        if (videoUrl) formData.append("videoUrl", videoUrl);
      }

      const castData = cast.map((member, index) => {
        if (member.imageFile) formData.append(`castImage_${index}`, member.imageFile);
        return { name: member.name || "Unknown", image: member.imageUrl || "" };
      });
      formData.append("cast", JSON.stringify(castData));

      const progressHandler = (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percent);
      };

      let response;
      if (contentType === "movie") {
        response = await addMovie(formData, progressHandler);
      } else if (contentType === "series") {
        response = await addSeries(formData, progressHandler);
      } else {
        response = await addShortDrama(formData, progressHandler);
      }

      if (!response.data.success) {
        toast.error(response.data.message || "Failed to add content.");
        return;
      }

      const newId = response.data.movie?._id
        || response.data.series?._id
        || response.data.shortDrama?._id
        || response.data.data?._id;

      // ── Step 2: Upload episodes sequentially (if any) ──
      if (contentType === "series" && seasons.length > 0 && newId) {
        let totalEps = seasons.reduce((acc, s) => acc + s.episodes.length, 0);
        let epCount = 0;
        for (const season of seasons) {
          for (const ep of season.episodes) {
            epCount++;
            setEpisodeUploadStatus(`Uploading S${season.seasonNumber}E${ep.episodeNumber} (${epCount}/${totalEps})...`);
            setUploadProgress(0);
            const epForm = new FormData();
            epForm.append("seriesId", newId);
            epForm.append("seasonNumber", season.seasonNumber);
            epForm.append("episodeNumber", ep.episodeNumber);
            epForm.append("title", ep.title || "");
            epForm.append("duration", ep.duration || "");
            if (ep.videoFile) epForm.append("video", ep.videoFile);
            else if (ep.videoUrl) epForm.append("videoUrl", ep.videoUrl);
            if (ep.thumbnailFile) epForm.append("thumbnail", ep.thumbnailFile);
            else if (ep.thumbnailUrl) epForm.append("thumbnailUrl", ep.thumbnailUrl);
            const epProgress = (pe) => setUploadProgress(Math.round((pe.loaded * 100) / pe.total));
            try { await addEpisode(epForm, epProgress); }
            catch (epErr) { toast.error(epErr?.response?.data?.message || `Failed: S${season.seasonNumber}E${ep.episodeNumber}`); }
          }
        }
        setEpisodeUploadStatus("");
        toast.success(`Series + ${totalEps} episode(s) added successfully!`);
      } else if (contentType === "shortdrama" && episodes.length > 0 && newId) {
        for (let i = 0; i < episodes.length; i++) {
          const ep = episodes[i];
          setEpisodeUploadStatus(`Uploading episode ${i + 1} of ${episodes.length}...`);
          setUploadProgress(0);
          const epForm = new FormData();
          epForm.append("episodeNumber", ep.episodeNumber);
          epForm.append("title", ep.title || "");
          epForm.append("duration", ep.duration || "");
          epForm.append("isLocked", ep.isLocked ? "true" : "false");
          epForm.append("isVertical", ep.isVertical ? "true" : "false");
          if (ep.videoFile) epForm.append("video", ep.videoFile);
          else if (ep.videoUrl) epForm.append("videoUrl", ep.videoUrl);
          if (ep.thumbnailFile) epForm.append("thumbnail", ep.thumbnailFile);
          else if (ep.thumbnailUrl) epForm.append("thumbnailUrl", ep.thumbnailUrl);
          const epProgress = (pe) => setUploadProgress(Math.round((pe.loaded * 100) / pe.total));
          try { await addDramaEpisode(newId, epForm, epProgress); }
          catch (epErr) { toast.error(epErr?.response?.data?.message || `Failed to upload episode ${i + 1}`); }
        }
        setEpisodeUploadStatus("");
        toast.success(`Short Drama + ${episodes.length} episode(s) added successfully!`);
      } else {
        toast.success(`${contentType.toUpperCase()} added successfully!`);
      }

      handleResetForm();
    } catch (err) {
      toast.error(err?.response?.data?.message || "An error occurred during submission.");
      console.error(err);
    } finally {
      setUploading(false);
      setEpisodeUploadStatus("");
    }
  };

  return (
    <div className="space-y-6 relative max-w-6xl mx-auto">
      <ToastContainer
        theme="dark"
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-widest text-soft-gray uppercase">CONTENT CREATOR</div>
          <div className="mt-1 text-2xl font-extrabold metallic">Add New Content</div>
          <div className="mt-1 text-sm text-soft-gray/90">
            Publish movies, series, or short dramas directly to the platform database.
          </div>
        </div>

        {/* Custom Segmented Control for Switch */}
        <div className="relative flex p-1 rounded-2xl border border-[rgba(212,175,55,0.14)] bg-black/30 w-full md:w-96 glass">
          {/* Animated Background Selector */}
          <div className="absolute inset-y-1 left-1 right-1 grid grid-cols-3 pointer-events-none">
            <motion.div
              layoutId="activeTabBg"
              className="rounded-xl bg-gradient-to-r from-gold-DEFAULT via-gold-soft to-gold-neon h-full"
              animate={{
                x: contentType === "movie" ? "0%" : contentType === "series" ? "100%" : "200%",
              }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />
          </div>

          <button
            onClick={() => setContentType("movie")}
            className={`relative flex-1 py-2 text-center text-xs font-bold transition-colors z-10 uppercase tracking-widest ${
              contentType === "movie" ? "text-black" : "text-soft-gray/80 hover:text-white"
            }`}
          >
            Movie
          </button>
          <button
            onClick={() => setContentType("series")}
            className={`relative flex-1 py-2 text-center text-xs font-bold transition-colors z-10 uppercase tracking-widest ${
              contentType === "series" ? "text-black" : "text-soft-gray/80 hover:text-white"
            }`}
          >
            Web Series
          </button>
          <button
            onClick={() => setContentType("shortdrama")}
            className={`relative flex-1 py-2 text-center text-xs font-bold transition-colors z-10 uppercase tracking-widest ${
              contentType === "shortdrama" ? "text-black" : "text-soft-gray/80 hover:text-white"
            }`}
          >
            Short Drama
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Metadata Panel (Left 2 cols on wide screens) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-[rgba(212,175,55,0.14)] bg-black/10 glass p-5 space-y-4">
            <h3 className="text-sm font-bold text-gold-neon/90 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-[rgba(212,175,55,0.1)]">
              <FiFilm className="h-4 w-4" /> Core Metadata
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-soft-gray mb-1.5 uppercase">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter content title..."
                  className="w-full rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/20 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold-DEFAULT transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-soft-gray mb-1.5 uppercase">Description</label>
                <div className="flex gap-2 items-start rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/20 px-4 py-2.5 focus-within:border-gold-DEFAULT transition-all">
                  <FiAlignLeft className="text-soft-gray/60 mt-1 h-4 w-4" />
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter short description/synopsis..."
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30 resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-soft-gray mb-1.5 uppercase">Release Year</label>
                  <input
                    type="number"
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(e.target.value)}
                    placeholder="2026"
                    className="w-full rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/20 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold-DEFAULT transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-soft-gray mb-1.5 uppercase">Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder={contentType === "movie" ? "2h 15m" : "10 Episodes"}
                    className="w-full rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/20 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold-DEFAULT transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-soft-gray mb-1.5 uppercase">Language</label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="e.g. Tamil, Hindi, English…"
                    spellCheck={false}
                    autoComplete="off"
                    className="w-full rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/20 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold-DEFAULT transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-soft-gray mb-1.5 uppercase">Rating (0 – 10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={rating}
                    onChange={handleRatingChange}
                    onBlur={() => {
                      if (rating !== "" && parseFloat(rating) > 10) setRating(10);
                      if (rating !== "" && parseFloat(rating) < 0)  setRating(0);
                    }}
                    placeholder="8.5"
                    className="w-full rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/20 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold-DEFAULT transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 items-center">
                {/* Priority */}
                <div>
                  <label className="block text-xs font-bold text-soft-gray mb-1.5 uppercase flex items-center gap-1">
                    <FiTrendingUp className="h-3.5 w-3.5" /> Priority Rating
                  </label>
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    placeholder="Auto Assigned"
                    className="w-full rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/20 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold-DEFAULT transition-all"
                  />
                </div>

                {/* Premium Switch */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPremium(!isPremium)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      isPremium ? "bg-gold-neon" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isPremium ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <div>
                    <div className="text-xs font-bold text-white uppercase">Premium Content</div>
                    <div className="text-[10px] text-soft-gray/70">Requires subscription plan</div>
                  </div>
                </div>

                {/* Coming Soon Switch */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsComingSoon(!isComingSoon)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      isComingSoon ? "bg-gold-neon" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isComingSoon ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <div>
                    <div className="text-xs font-bold text-white uppercase">Coming Soon</div>
                    <div className="text-[10px] text-soft-gray/70">Renders placeholders & releases later</div>
                  </div>
                </div>
              </div>

              {/* Release date, visible only if coming soon is toggled */}
              <AnimatePresence>
                {isComingSoon && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-soft-gray mb-1.5 uppercase flex items-center gap-1.5">
                        <FiCalendar className="h-3.5 w-3.5" /> Scheduled Release Date
                      </label>
                      <input
                        type="date"
                        value={releaseDate}
                        onChange={(e) => setReleaseDate(e.target.value)}
                        className="rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/20 px-4 py-2.5 text-sm text-white outline-none focus:border-gold-DEFAULT transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Tags selectors card */}
          <div className="rounded-2xl border border-[rgba(212,175,55,0.14)] bg-black/10 glass p-5 space-y-4">
            <h3 className="text-sm font-bold text-gold-neon/90 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-[rgba(212,175,55,0.1)]">
              <FiInfo className="h-4 w-4" /> Taxonomy & Categories
            </h3>

            {/* Genres */}
            <div>
              <label className="block text-xs font-bold text-soft-gray mb-2 uppercase">Genres</label>
              <div className="flex flex-wrap gap-2">
                {/* Preset genres + any custom ones already selected */}
                {[...new Set([...AVAILABLE_GENRES, ...selectedGenres.filter(g => !AVAILABLE_GENRES.includes(g))])].map((g) => {
                  const selected = selectedGenres.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleGenreToggle(g)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 flex items-center gap-1 ${
                        selected
                          ? "bg-gold-DEFAULT/10 border-gold-DEFAULT text-gold-soft shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                          : "border-white/10 bg-black/10 text-soft-gray hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {selected && <FiCheck className="h-3.5 w-3.5" />}
                      {g}
                    </button>
                  );
                })}
              </div>
              {/* Custom Genre Input */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-xl border border-dashed border-[rgba(212,175,55,0.2)] bg-black/10 px-3 py-2 focus-within:border-gold-DEFAULT transition-all">
                  <FiPlus className="h-3 w-3 text-soft-gray/50 shrink-0" />
                  <input
                    type="text"
                    value={customGenreInput}
                    onChange={(e) => setCustomGenreInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomGenre())}
                    placeholder="Type custom genre and press Enter or +"
                    className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/25"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomGenre}
                  disabled={!customGenreInput.trim()}
                  className="rounded-xl border border-[rgba(212,175,55,0.2)] bg-gold-DEFAULT/10 px-3 py-2 text-xs font-bold text-gold-soft hover:bg-gold-DEFAULT/20 transition-all disabled:opacity-30"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-soft-gray mb-2 uppercase">Publishing Categories</label>
              <div className="flex flex-wrap gap-2">
                {/* Preset categories + any custom ones already selected */}
                {[...new Set([...AVAILABLE_CATEGORIES, ...selectedCategories.filter(c => !AVAILABLE_CATEGORIES.includes(c))])].map((c) => {
                  const selected = selectedCategories.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleCategoryToggle(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 flex items-center gap-1 ${
                        selected
                          ? "bg-gold-DEFAULT/10 border-gold-DEFAULT text-gold-soft shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                          : "border-white/10 bg-black/10 text-soft-gray hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {selected && <FiCheck className="h-3.5 w-3.5" />}
                      {c}
                    </button>
                  );
                })}
              </div>
              {/* Custom Category Input */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-xl border border-dashed border-[rgba(212,175,55,0.2)] bg-black/10 px-3 py-2 focus-within:border-gold-DEFAULT transition-all">
                  <FiPlus className="h-3 w-3 text-soft-gray/50 shrink-0" />
                  <input
                    type="text"
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomCategory())}
                    placeholder="Type custom category and press Enter or +"
                    className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/25"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  disabled={!customCategoryInput.trim()}
                  className="rounded-xl border border-[rgba(212,175,55,0.2)] bg-gold-DEFAULT/10 px-3 py-2 text-xs font-bold text-gold-soft hover:bg-gold-DEFAULT/20 transition-all disabled:opacity-30"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Media Uploads & Cast Panel (Right column on wide screens) */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[rgba(212,175,55,0.14)] bg-black/10 glass p-5 space-y-5">
            <h3 className="text-sm font-bold text-gold-neon/90 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-[rgba(212,175,55,0.1)]">
              <FiImage className="h-4 w-4" /> Media Files
            </h3>

            {/* Poster upload + URL */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-soft-gray uppercase">Poster Image</label>
                <span className="text-[10px] text-soft-gray/50 font-mono">Max 5MB</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/20 p-2 focus-within:border-gold-DEFAULT transition-all">
                <div className="relative flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer overflow-hidden group shrink-0">
                  <FiUpload className="h-4 w-4 text-soft-gray group-hover:text-white transition-colors" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  {posterFile ? (
                    <div className="text-xs text-gold-neon font-bold truncate pr-2" title={posterFile.name}>
                      {posterFile.name}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-1.5">
                      <FiLink className="h-3 w-3 text-soft-gray/60" />
                      <input
                        type="text"
                        value={posterUrl}
                        onChange={(e) => setPosterUrl(e.target.value)}
                        placeholder="Paste image URL here..."
                        className="bg-transparent text-xs text-white outline-none placeholder:text-white/20 w-full"
                      />
                    </div>
                  )}
                </div>
                {posterFile && (
                  <button
                    type="button"
                    onClick={() => setPosterFile(null)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Banner upload + URL */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-soft-gray uppercase">Hero Banner</label>
                <span className="text-[10px] text-soft-gray/50 font-mono">Max 5MB</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/20 p-2 focus-within:border-gold-DEFAULT transition-all">
                <div className="relative flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer overflow-hidden group shrink-0">
                  <FiUpload className="h-4 w-4 text-soft-gray group-hover:text-white transition-colors" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  {bannerFile ? (
                    <div className="text-xs text-gold-neon font-bold truncate pr-2" title={bannerFile.name}>
                      {bannerFile.name}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-1.5">
                      <FiLink className="h-3 w-3 text-soft-gray/60" />
                      <input
                        type="text"
                        value={bannerUrl}
                        onChange={(e) => setBannerUrl(e.target.value)}
                        placeholder="Paste banner URL here..."
                        className="bg-transparent text-xs text-white outline-none placeholder:text-white/20 w-full"
                      />
                    </div>
                  )}
                </div>
                {bannerFile && (
                  <button
                    type="button"
                    onClick={() => setBannerFile(null)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Trailer upload + URL */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-soft-gray uppercase flex items-center gap-1">
                  <FiYoutube className="h-3.5 w-3.5" /> Trailer Clip
                </label>
                <span className="text-[10px] text-soft-gray/50 font-mono">Max 5GB</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/20 p-2 focus-within:border-gold-DEFAULT transition-all">
                <div className="relative flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer overflow-hidden group shrink-0">
                  <FiUpload className="h-4 w-4 text-soft-gray group-hover:text-white transition-colors" />
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setTrailerFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  {trailerFile ? (
                    <div className="text-xs text-gold-neon font-bold truncate pr-2" title={trailerFile.name}>
                      {trailerFile.name}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-1.5">
                      <FiLink className="h-3 w-3 text-soft-gray/60" />
                      <input
                        type="text"
                        value={trailerUrl}
                        onChange={(e) => setTrailerUrl(e.target.value)}
                        placeholder="Paste trailer video URL..."
                        className="bg-transparent text-xs text-white outline-none placeholder:text-white/20 w-full"
                      />
                    </div>
                  )}
                </div>
                {trailerFile && (
                  <button
                    type="button"
                    onClick={() => setTrailerFile(null)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Video File / URL - Show only for Movies */}
            <AnimatePresence>
              {contentType === "movie" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-soft-gray uppercase flex items-center gap-1">
                      <FiPlay className="h-3.5 w-3.5" /> Full Movie Video
                    </label>
                    <span className="text-[10px] text-soft-gray/50 font-mono">Max 5GB</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/20 p-2 focus-within:border-gold-DEFAULT transition-all">
                    <div className="relative flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer overflow-hidden group shrink-0">
                      <FiUpload className="h-4 w-4 text-soft-gray group-hover:text-white transition-colors" />
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      {videoFile ? (
                        <div className="text-xs text-gold-neon font-bold truncate pr-2" title={videoFile.name}>
                          {videoFile.name}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-1.5">
                          <FiLink className="h-3 w-3 text-soft-gray/60" />
                          <input
                            type="text"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="Paste movie video URL..."
                            className="bg-transparent text-xs text-white outline-none placeholder:text-white/20 w-full"
                          />
                        </div>
                      )}
                    </div>
                    {videoFile && (
                      <button
                        type="button"
                        onClick={() => setVideoFile(null)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </form>

      {/* Episodes Section */}
      <AnimatePresence>
        {(contentType === "series" || contentType === "shortdrama") && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="rounded-2xl border border-[rgba(212,175,55,0.14)] bg-black/10 glass p-5 space-y-4"
          >
            {/* ── SERIES: Season-based UI ── */}
            {contentType === "series" && (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(212,175,55,0.1)]">
                  <div>
                    <h3 className="text-sm font-bold text-gold-neon/90 uppercase tracking-wider flex items-center gap-2">
                      <FiPlay className="h-4 w-4" /> Seasons & Episodes
                      {seasons.length > 0 && (
                        <span className="ml-1 rounded-full bg-gold-DEFAULT/20 border border-gold-DEFAULT/30 px-2 py-0.5 text-[10px] font-bold text-gold-soft">
                          {seasons.reduce((a, s) => a + s.episodes.length, 0)} ep
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-soft-gray/50 mt-0.5">Add seasons first, then add episodes inside each season.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSeason}
                    className="flex items-center gap-1 text-xs font-bold text-gold-soft hover:text-gold-neon hover:scale-105 transition-all bg-gold-DEFAULT/10 border border-gold-DEFAULT/20 px-3 py-1.5 rounded-xl"
                  >
                    <FiPlus className="h-3.5 w-3.5" /> Add Season
                  </button>
                </div>

                {seasons.length === 0 ? (
                  <div className="py-6 text-center text-xs text-soft-gray/50">
                    No seasons added yet. Click <span className="text-gold-soft font-bold">+ Add Season</span> to start.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {seasons.map((season, sIdx) => (
                      <motion.div
                        key={sIdx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-gold-DEFAULT/20 bg-black/20 overflow-hidden"
                      >
                        {/* Season Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gold-DEFAULT/5 border-b border-gold-DEFAULT/10">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-extrabold text-gold-neon uppercase tracking-widest">
                              Season {season.seasonNumber}
                            </span>
                            <span className="text-[10px] text-soft-gray/50 font-mono">
                              {season.episodes.length} episode{season.episodes.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleAddEpisodeToSeason(sIdx)}
                              className="flex items-center gap-1 text-[10px] font-bold text-gold-soft hover:text-gold-neon transition-all bg-gold-DEFAULT/10 border border-gold-DEFAULT/20 px-2.5 py-1 rounded-lg"
                            >
                              <FiPlus className="h-3 w-3" /> Add Episode
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSeason(sIdx)}
                              className="text-soft-gray/40 hover:text-red-400 transition-colors p-1"
                              title="Remove season"
                            >
                              <FiTrash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Episodes inside this season */}
                        <div className="p-4 space-y-3">
                          {season.episodes.length === 0 ? (
                            <div className="py-4 text-center text-[10px] text-soft-gray/40">
                              No episodes yet. Click <span className="text-gold-soft font-bold">+ Add Episode</span> above.
                            </div>
                          ) : (
                            season.episodes.map((ep, eIdx) => (
                              <motion.div
                                key={eIdx}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="rounded-lg border border-white/6 bg-black/20 p-3 space-y-3 relative group"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEpisodeFromSeason(sIdx, eIdx)}
                                  className="absolute top-2 right-2 text-soft-gray/40 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
                                >
                                  <FiTrash2 className="h-3 w-3" />
                                </button>

                                <div className="text-[10px] font-bold text-soft-gray/50 uppercase tracking-widest">Episode {eIdx + 1}</div>

                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="block text-[10px] font-bold text-soft-gray mb-1 uppercase">Ep. # *</label>
                                    <input
                                      type="number" min="1" required
                                      value={ep.episodeNumber}
                                      onChange={(e) => handleSeasonEpisodeChange(sIdx, eIdx, "episodeNumber", e.target.value)}
                                      placeholder={eIdx + 1}
                                      className="w-full rounded-lg border border-[rgba(212,175,55,0.14)] bg-black/20 px-2 py-1.5 text-xs text-white outline-none placeholder:text-white/20 focus:border-gold-DEFAULT transition-all"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-soft-gray mb-1 uppercase">Title</label>
                                    <input
                                      type="text"
                                      value={ep.title}
                                      onChange={(e) => handleSeasonEpisodeChange(sIdx, eIdx, "title", e.target.value)}
                                      placeholder="Episode title..."
                                      className="w-full rounded-lg border border-[rgba(212,175,55,0.14)] bg-black/20 px-2 py-1.5 text-xs text-white outline-none placeholder:text-white/20 focus:border-gold-DEFAULT transition-all"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-soft-gray mb-1 uppercase">Duration</label>
                                    <input
                                      type="text"
                                      value={ep.duration}
                                      onChange={(e) => handleSeasonEpisodeChange(sIdx, eIdx, "duration", e.target.value)}
                                      placeholder="e.g. 45m"
                                      className="w-full rounded-lg border border-[rgba(212,175,55,0.14)] bg-black/20 px-2 py-1.5 text-xs text-white outline-none placeholder:text-white/20 focus:border-gold-DEFAULT transition-all"
                                    />
                                  </div>
                                </div>

                                {/* Video */}
                                <div className="flex items-center gap-2 rounded-lg border border-[rgba(212,175,55,0.12)] bg-black/20 p-1.5">
                                  <div className="relative flex items-center justify-center p-1.5 rounded-md bg-white/5 hover:bg-white/10 cursor-pointer overflow-hidden shrink-0">
                                    <FiUpload className="h-3 w-3 text-soft-gray" />
                                    <span className="absolute inset-0 text-[8px] text-center text-soft-gray/50 flex items-end justify-center pb-0.5">VID</span>
                                    <input type="file" accept="video/*" onChange={(e) => handleSeasonEpisodeChange(sIdx, eIdx, "videoFile", e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    {ep.videoFile ? (
                                      <div className="text-[10px] text-gold-neon font-bold truncate">{ep.videoFile.name}</div>
                                    ) : (
                                      <div className="flex items-center gap-1">
                                        <FiLink className="h-2.5 w-2.5 text-soft-gray/50 shrink-0" />
                                        <input type="text" value={ep.videoUrl} onChange={(e) => handleSeasonEpisodeChange(sIdx, eIdx, "videoUrl", e.target.value)} placeholder="Video URL..." className="bg-transparent text-[10px] text-white outline-none placeholder:text-white/15 w-full" />
                                      </div>
                                    )}
                                  </div>
                                  {ep.videoFile && <button type="button" onClick={() => handleSeasonEpisodeChange(sIdx, eIdx, "videoFile", null)} className="text-red-400 p-0.5"><FiTrash2 className="h-3 w-3" /></button>}
                                </div>

                                {/* Thumbnail */}
                                <div className="flex items-center gap-2 rounded-lg border border-[rgba(212,175,55,0.12)] bg-black/20 p-1.5">
                                  <div className="relative flex items-center justify-center p-1.5 rounded-md bg-white/5 hover:bg-white/10 cursor-pointer overflow-hidden shrink-0">
                                    <FiImage className="h-3 w-3 text-soft-gray" />
                                    <input type="file" accept="image/*" onChange={(e) => handleSeasonEpisodeChange(sIdx, eIdx, "thumbnailFile", e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    {ep.thumbnailFile ? (
                                      <div className="text-[10px] text-gold-neon font-bold truncate">{ep.thumbnailFile.name}</div>
                                    ) : (
                                      <div className="flex items-center gap-1">
                                        <FiLink className="h-2.5 w-2.5 text-soft-gray/50 shrink-0" />
                                        <input type="text" value={ep.thumbnailUrl} onChange={(e) => handleSeasonEpisodeChange(sIdx, eIdx, "thumbnailUrl", e.target.value)} placeholder="Thumbnail URL..." className="bg-transparent text-[10px] text-white outline-none placeholder:text-white/15 w-full" />
                                      </div>
                                    )}
                                  </div>
                                  {ep.thumbnailFile && <button type="button" onClick={() => handleSeasonEpisodeChange(sIdx, eIdx, "thumbnailFile", null)} className="text-red-400 p-0.5"><FiTrash2 className="h-3 w-3" /></button>}
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── SHORT DRAMA: flat episode list ── */}
            {contentType === "shortdrama" && (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(212,175,55,0.1)]">
                  <div>
                    <h3 className="text-sm font-bold text-gold-neon/90 uppercase tracking-wider flex items-center gap-2">
                      <FiPlay className="h-4 w-4" /> Drama Episodes
                      {episodes.length > 0 && (
                        <span className="ml-1 rounded-full bg-gold-DEFAULT/20 border border-gold-DEFAULT/30 px-2 py-0.5 text-[10px] font-bold text-gold-soft">{episodes.length}</span>
                      )}
                    </h3>
                    <p className="text-[10px] text-soft-gray/50 mt-0.5">Drama episodes will be attached after creating the short drama.</p>
                  </div>
                  <button type="button" onClick={handleAddEpisode} className="flex items-center gap-1 text-xs font-bold text-gold-soft hover:text-gold-neon hover:scale-105 transition-all bg-gold-DEFAULT/10 border border-gold-DEFAULT/20 px-3 py-1.5 rounded-xl">
                    <FiPlus className="h-3.5 w-3.5" /> Add Episode
                  </button>
                </div>

                {episodes.length === 0 ? (
                  <div className="py-6 text-center text-xs text-soft-gray/50">No episodes added yet. Click <span className="text-gold-soft font-bold">+ Add Episode</span> to start.</div>
                ) : (
                  <div className="space-y-4">
                    {episodes.map((ep, index) => (
                      <motion.div key={index} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-white/8 bg-black/20 p-4 space-y-3 relative group">
                        <button type="button" onClick={() => handleRemoveEpisode(index)} className="absolute top-3 right-3 text-soft-gray/50 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100"><FiTrash2 className="h-3.5 w-3.5" /></button>
                        <div className="text-[10px] font-bold text-gold-soft/70 uppercase tracking-widest">Episode #{index + 1}</div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-soft-gray mb-1 uppercase">Ep. Number *</label>
                            <input type="number" min="1" required value={ep.episodeNumber} onChange={(e) => handleEpisodeChange(index, "episodeNumber", e.target.value)} placeholder="1" className="w-full rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold-DEFAULT transition-all" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-soft-gray mb-1 uppercase">Duration</label>
                            <input type="text" value={ep.duration} onChange={(e) => handleEpisodeChange(index, "duration", e.target.value)} placeholder="e.g. 2m 30s" className="w-full rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold-DEFAULT transition-all" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-soft-gray mb-1 uppercase">Title</label>
                          <input type="text" value={ep.title} onChange={(e) => handleEpisodeChange(index, "title", e.target.value)} placeholder="Episode title..." className="w-full rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold-DEFAULT transition-all" />
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => handleEpisodeChange(index, "isLocked", !ep.isLocked)} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${ep.isLocked ? "bg-gold-neon" : "bg-white/10"}`}>
                              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${ep.isLocked ? "translate-x-4" : "translate-x-0"}`} />
                            </button>
                            <span className="text-[10px] font-bold text-soft-gray uppercase">Premium (Locked)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => handleEpisodeChange(index, "isVertical", !ep.isVertical)} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${ep.isVertical ? "bg-gold-neon" : "bg-white/10"}`}>
                              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${ep.isVertical ? "translate-x-4" : "translate-x-0"}`} />
                            </button>
                            <span className="text-[10px] font-bold text-soft-gray uppercase">Vertical Video</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/20 p-2 focus-within:border-gold-DEFAULT transition-all">
                          <div className="relative flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer overflow-hidden group shrink-0"><FiUpload className="h-3.5 w-3.5 text-soft-gray group-hover:text-white transition-colors" /><input type="file" accept="video/*" onChange={(e) => handleEpisodeChange(index, "videoFile", e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" /></div>
                          <div className="flex-1 min-w-0">{ep.videoFile ? <div className="text-xs text-gold-neon font-bold truncate pr-2">{ep.videoFile.name}</div> : <div className="flex items-center gap-1.5 px-1"><FiLink className="h-3 w-3 text-soft-gray/60" /><input type="text" value={ep.videoUrl} onChange={(e) => handleEpisodeChange(index, "videoUrl", e.target.value)} placeholder="Paste video URL..." className="bg-transparent text-xs text-white outline-none placeholder:text-white/20 w-full" /></div>}</div>
                          {ep.videoFile && <button type="button" onClick={() => handleEpisodeChange(index, "videoFile", null)} className="text-red-400 hover:text-red-300 p-1"><FiTrash2 className="h-3.5 w-3.5" /></button>}
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/20 p-2 focus-within:border-gold-DEFAULT transition-all">
                          <div className="relative flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer overflow-hidden group shrink-0"><FiUpload className="h-3.5 w-3.5 text-soft-gray group-hover:text-white transition-colors" /><input type="file" accept="image/*" onChange={(e) => handleEpisodeChange(index, "thumbnailFile", e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" /></div>
                          <div className="flex-1 min-w-0">{ep.thumbnailFile ? <div className="text-xs text-gold-neon font-bold truncate pr-2">{ep.thumbnailFile.name}</div> : <div className="flex items-center gap-1.5 px-1"><FiLink className="h-3 w-3 text-soft-gray/60" /><input type="text" value={ep.thumbnailUrl} onChange={(e) => handleEpisodeChange(index, "thumbnailUrl", e.target.value)} placeholder="Paste thumbnail URL..." className="bg-transparent text-xs text-white outline-none placeholder:text-white/20 w-full" /></div>}</div>
                          {ep.thumbnailFile && <button type="button" onClick={() => handleEpisodeChange(index, "thumbnailFile", null)} className="text-red-400 hover:text-red-300 p-1"><FiTrash2 className="h-3.5 w-3.5" /></button>}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
</AnimatePresence>
      {/* Dynamic Cast Form Panel */}
      <div className="rounded-2xl border border-[rgba(212,175,55,0.14)] bg-black/10 glass p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[rgba(212,175,55,0.1)]">
          <h3 className="text-sm font-bold text-gold-neon/90 uppercase tracking-wider flex items-center gap-2">
            <FiUsers className="h-4 w-4" /> Cast & Credits
          </h3>
          <button
            type="button"
            onClick={handleAddCastMember}
            className="flex items-center gap-1 text-xs font-bold text-gold-soft hover:text-gold-neon hover:scale-105 transition-all bg-gold-DEFAULT/10 border border-gold-DEFAULT/20 px-3 py-1.5 rounded-xl"
          >
            <FiPlus className="h-3.5 w-3.5" /> Add Member
          </button>
        </div>

        {cast.length === 0 ? (
          <div className="py-6 text-center text-xs text-soft-gray/60">No cast members added yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cast.map((member, index) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={index}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/15 p-3 relative group"
              >
                {/* Trash Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveCastMember(index)}
                  className="absolute top-2 right-2 text-soft-gray hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  title="Remove cast member"
                >
                  <FiTrash2 className="h-3.5 w-3.5" />
                </button>

                {/* Avatar uploader */}
                <div className="relative h-12 w-12 rounded-lg border border-[rgba(212,175,55,0.2)] bg-black/30 overflow-hidden flex items-center justify-center shrink-0">
                  {member.imageFile ? (
                    <img
                      src={URL.createObjectURL(member.imageFile)}
                      alt="Cast avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : member.imageUrl ? (
                    <img src={member.imageUrl} alt="Cast avatar" className="h-full w-full object-cover" />
                  ) : (
                    <FiUsers className="h-5 w-5 text-soft-gray/50" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCastChange(index, "imageFile", e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>

                <div className="flex-1 space-y-2 min-w-0 pr-6">
                  {/* Name Input */}
                  <input
                    type="text"
                    required
                    value={member.name}
                    onChange={(e) => handleCastChange(index, "name", e.target.value)}
                    placeholder="Actor Name"
                    className="w-full bg-transparent text-xs text-white border-b border-white/10 pb-0.5 outline-none focus:border-gold-DEFAULT transition-all"
                  />
                  {/* Photo URL Input */}
                  {!member.imageFile && (
                    <div className="flex items-center gap-1.5">
                      <FiLink className="h-3 w-3 text-soft-gray/40 shrink-0" />
                      <input
                        type="text"
                        value={member.imageUrl}
                        onChange={(e) => handleCastChange(index, "imageUrl", e.target.value)}
                        placeholder="Image URL (optional)"
                        className="bg-transparent text-[10px] text-white/70 outline-none placeholder:text-white/20 w-full"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Upload/Progress and Submit section */}
      <div className="rounded-2xl border border-[rgba(212,175,55,0.14)] bg-black/10 glass p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full">
          {uploading ? (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-soft-gray">
                <span className="animate-pulse">
                  {episodeUploadStatus || "UPLOADING MEDIA STREAMS..."}
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden border border-white/5 relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-gold-DEFAULT via-gold-neon to-gold-soft"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          ) : (
            <div className="text-xs text-soft-gray/60 flex items-center gap-2">
              <FiInfo className="text-gold-soft h-4 w-4 shrink-0" />
              <span>Ensure all required fields are filled out. You can upload files directly or provide custom media URLs.</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 shrink-0 w-full md:w-auto">
          <button
            type="button"
            disabled={uploading}
            onClick={handleResetForm}
            className="flex-1 md:flex-initial rounded-xl border border-white/10 bg-black/20 hover:bg-black/40 px-5 py-2.5 text-xs font-bold text-soft-gray hover:text-white transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            Clear Form
          </button>

          <button
            type="submit"
            disabled={uploading}
            onClick={handleSubmit}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-DEFAULT via-gold-soft to-gold-neon px-6 py-2.5 text-xs font-extrabold text-black shadow-premium hover:brightness-110 disabled:opacity-50 disabled:pointer-events-none transition-all"
          >
            {uploading ? "Uploading..." : `Publish ${contentType.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}
