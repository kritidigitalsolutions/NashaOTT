import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiFilm,
  FiTv,
  FiPlayCircle,
  FiGrid,
  FiEye,
  FiX,
  FiStar,
  FiCalendar,
  FiGlobe,
  FiTag,
  FiShield,
  FiCheck,
  FiRefreshCw,
  FiSave,
  FiPlus,
  FiUpload,
  FiLink,
  FiInfo,
  FiImage,
  FiYoutube,
  FiUsers,
} from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getAllContent,
  getContentStats,
  deleteMovie,
  deleteSeries,
  deleteShortDrama,
  updateMovie,
  updateSeries,
  updateShortDrama,
} from "../../api/adminApi";

const AVAILABLE_GENRES = [
  "Action", "Romance", "Drama", "Comedy", "Thriller", "Horror", "Sci-Fi", "Crime", "Mystery", "Fantasy", "Adventure", "Family", "Documentary",
];

const AVAILABLE_CATEGORIES = [
  "Featured", "Trending", "Popular", "Slider", "Latest", "Recommended",
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

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────
const TYPE_COLORS = {
  movie:  { bg: "bg-blue-500/10",  border: "border-blue-500/30",  text: "text-blue-400"  },
  series: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" },
  drama:  { bg: "bg-pink-500/10",  border: "border-pink-500/30",  text: "text-pink-400"  },
};

function getTypeIcon(type) {
  switch (type) {
    case "movie":  return <FiFilm className="h-4 w-4" />;
    case "series": return <FiTv className="h-4 w-4" />;
    case "drama":  return <FiPlayCircle className="h-4 w-4" />;
    default:       return <FiGrid className="h-4 w-4" />;
  }
}

function getTypeBadge(type) {
  const colors = TYPE_COLORS[type] || TYPE_COLORS.movie;
  const labels = { movie: "Movie", series: "Series", drama: "Short Drama" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors.bg} ${colors.border} ${colors.text}`}>
      {getTypeIcon(type)}
      {labels[type] || "Content"}
    </span>
  );
}

async function callDelete(item) {
  const id = item._id;
  if (item.contentType === "movie")  return deleteMovie(id);
  if (item.contentType === "series") return deleteSeries(id);
  return deleteShortDrama(id);
}

async function callUpdate(item, formData, onProgress) {
  const id = item._id;
  if (item.contentType === "movie")  return updateMovie(id, formData, onProgress);
  if (item.contentType === "series") return updateSeries(id, formData, onProgress);
  return updateShortDrama(id, formData, onProgress);
}

// ────────────────────────────────────────────────────────────────────────────
// TOGGLE SWITCH COMPONENT
// ────────────────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label, sub }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
          checked ? "bg-gold-neon" : "bg-white/10"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      <div>
        <div className="text-xs font-bold text-white">{label}</div>
        {sub && <div className="text-[10px] text-soft-gray/60">{sub}</div>}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SKELETON CARD
// ────────────────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[rgba(212,175,55,0.12)]">
      <div className="h-[260px] animate-pulse bg-[rgba(212,175,55,0.1)]" />
      <div className="space-y-3 p-4">
        <div className="h-4 animate-pulse rounded bg-[rgba(212,175,55,0.12)]" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-[rgba(255,255,255,0.06)]" />
        <div className="h-10 animate-pulse rounded bg-[rgba(212,175,55,0.08)]" />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ────────────────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, title, value, color }) {
  return (
    <div className="glass rounded-2xl border border-[rgba(212,175,55,0.12)] p-5 flex items-center gap-4">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${color} bg-black/20`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold text-soft-gray uppercase tracking-wider">{title}</p>
        <h3 className="mt-0.5 text-2xl font-extrabold metallic">{value}</h3>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────────────────────
export default function ContentLibraryPage() {
  const [loading, setLoading]   = useState(true);
  const [content, setContent]   = useState([]);
  const [stats, setStats]       = useState({ movieCount: 0, seriesCount: 0, dramaCount: 0, totalContent: 0 });
  const [query, setQuery]       = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const [viewItem,   setViewItem]   = useState(null);
  const [editItem,   setEditItem]   = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({});
  const [customGenreInput, setCustomGenreInput] = useState("");
  const [customCategoryInput, setCustomCategoryInput] = useState("");

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

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contentRes, statsRes] = await Promise.all([getAllContent(), getContentStats()]);
      setContent(contentRes.data.content || []);
      setStats(statsRes.data || { movieCount: 0, seriesCount: 0, dramaCount: 0, totalContent: 0 });
    } catch (err) {
      toast.error("Failed to load content");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let items = [...content];
    if (activeTab !== "all") items = items.filter((i) => i.contentType === activeTab);
    if (query.trim())
      items = items.filter((i) =>
        (i.title || "").toLowerCase().includes(query.toLowerCase())
      );
    return items;
  }, [content, query, activeTab]);

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      await callDelete(item);
      setContent((prev) => prev.filter((c) => c._id !== item._id));
      toast.success(`"${item.title}" deleted successfully`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete content");
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setEditForm({
      title:       item.title       || "",
      description: item.description || "",
      releaseYear: item.releaseYear || "",
      duration:    item.duration    || "",
      language:    item.language    || "",
      rating:      item.rating      || "",
      priority:    item.priority    || "",
      isPremium:   !!item.isPremium,
      isComingSoon: !!item.isComingSoon,
      releaseDate: item.releaseDate ? new Date(item.releaseDate).toISOString().split('T')[0] : "",
      selectedGenres: item.genre || [],
      selectedCategories: item.category || [],
      posterUrl:   item.poster      || "",
      posterFile:  null,
      bannerUrl:   item.banner      || "",
      bannerFile:  null,
      trailerUrl:  item.trailerUrl  || "",
      trailerFile: null,
      videoUrl:    item.videoUrl    || "",
      videoFile:   null,
      cast:        item.cast?.map(c => ({ name: c.name, imageUrl: c.image || "", imageFile: null })) || [],
    });
    setCustomGenreInput("");
    setCustomCategoryInput("");
  };

  const handleGenreToggle = (genre) => {
    setEditForm(prev => ({
      ...prev,
      selectedGenres: prev.selectedGenres.includes(genre)
        ? prev.selectedGenres.filter((g) => g !== genre)
        : [...prev.selectedGenres, genre]
    }));
  };

  const handleCategoryToggle = (category) => {
    setEditForm(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(category)
        ? prev.selectedCategories.filter((c) => c !== category)
        : [...prev.selectedCategories, category]
    }));
  };

  const handleAddCustomGenre = () => {
    const trimmed = customGenreInput.trim();
    if (!trimmed) return;
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    if (!editForm.selectedGenres.includes(formatted)) {
      setEditForm(prev => ({ ...prev, selectedGenres: [...prev.selectedGenres, formatted] }));
    }
    setCustomGenreInput("");
  };

  const handleAddCustomCategory = () => {
    const trimmed = customCategoryInput.trim();
    if (!trimmed) return;
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    if (!editForm.selectedCategories.includes(formatted)) {
      setEditForm(prev => ({ ...prev, selectedCategories: [...prev.selectedCategories, formatted] }));
    }
    setCustomCategoryInput("");
  };

  const handleAddCastMember = () => {
    setEditForm(prev => ({ ...prev, cast: [...prev.cast, { name: "", imageFile: null, imageUrl: "" }] }));
  };

  const handleRemoveCastMember = (index) => {
    setEditForm(prev => ({ ...prev, cast: prev.cast.filter((_, i) => i !== index) }));
  };

  const handleCastChange = (index, field, value) => {
    setEditForm(prev => {
      const updated = [...prev.cast];
      updated[index][field] = value;
      return { ...prev, cast: updated };
    });
  };

  const handleRatingChange = (e) => {
    const val = e.target.value;
    if (val === "") { setEditForm(prev => ({ ...prev, rating: "" })); return; }
    const num = parseFloat(val);
    if (!isNaN(num)) setEditForm(prev => ({ ...prev, rating: Math.min(10, Math.max(0, num)) }));
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;

    if (editForm.posterFile && !validateFileSize(editForm.posterFile, "poster")) return;
    if (editForm.bannerFile && !validateFileSize(editForm.bannerFile, "banner")) return;
    if (editForm.trailerFile && !validateFileSize(editForm.trailerFile, "trailer")) return;
    if (editForm.videoFile && !validateFileSize(editForm.videoFile, "video")) return;
    for (let i = 0; i < editForm.cast.length; i++) {
      if (editForm.cast[i].imageFile && !validateFileSize(editForm.cast[i].imageFile, "castImage")) return;
    }

    try {
      setEditSaving(true);
      const fd = new FormData();
      fd.append("title",       editForm.title);
      fd.append("description", editForm.description);
      fd.append("releaseYear", editForm.releaseYear);
      fd.append("duration",    editForm.duration);
      fd.append("language",    editForm.language);
      fd.append("rating",      editForm.rating || 0);
      if (editForm.priority) fd.append("priority", editForm.priority);
      fd.append("isPremium",   editForm.isPremium   ? "true" : "false");
      fd.append("isComingSoon", editForm.isComingSoon ? "true" : "false");
      if (editForm.isComingSoon && editForm.releaseDate) {
        fd.append("releaseDate", editForm.releaseDate);
      } else if (!editForm.isComingSoon) {
        fd.append("releaseDate", "null");
      }

      fd.append("genre", JSON.stringify(editForm.selectedGenres));
      fd.append("category", JSON.stringify(editForm.selectedCategories));

      if (editForm.posterFile) fd.append("poster", editForm.posterFile);
      if (editForm.posterUrl)  { fd.append("posterUrl", editForm.posterUrl); fd.append("poster", editForm.posterUrl); }

      if (editForm.bannerFile) fd.append("banner", editForm.bannerFile);
      if (editForm.bannerUrl)  { fd.append("bannerUrl", editForm.bannerUrl); fd.append("banner", editForm.bannerUrl); }

      if (editForm.trailerFile) fd.append("trailer", editForm.trailerFile);
      if (editForm.trailerUrl) fd.append("trailerUrl", editForm.trailerUrl);

      if (editItem.contentType === "movie") {
        if (editForm.videoFile) fd.append("video", editForm.videoFile);
        if (editForm.videoUrl) fd.append("videoUrl", editForm.videoUrl);
      }

      const castData = editForm.cast.map((member, index) => {
        if (member.imageFile) {
          fd.append(`castImage_${index}`, member.imageFile);
        }
        return {
          name: member.name || "Unknown",
          image: member.imageUrl || "",
        };
      });
      fd.append("cast", JSON.stringify(castData));

      const res = await callUpdate(editItem, fd);
      if (res.data.success) {
        toast.success("Content updated successfully!");
        const updated = res.data.movie || res.data.series || res.data.shortDrama || res.data.drama || {};
        setContent((prev) =>
          prev.map((c) =>
            c._id === editItem._id ? { ...c, ...updated, contentType: editItem.contentType } : c
          )
        );
        setEditItem(null);
      } else {
        toast.error(res.data.message || "Update failed");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update content");
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer theme="dark" position="top-right" autoClose={2800} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover draggable />

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[4px] text-soft-gray uppercase">Content Library</p>
          <h1 className="mt-1 text-2xl font-extrabold metallic">Manage All Content</h1>
          <p className="mt-1 text-sm text-soft-gray/80">Movies, Web Series and Short Dramas in one unified panel.</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 self-start rounded-2xl border border-[rgba(212,175,55,0.2)] bg-black/30 px-4 py-2 text-xs font-bold text-soft-gray hover:text-white transition-all disabled:opacity-50"
        >
          <FiRefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </motion.div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={FiFilm}       title="Movies"        value={stats.movieCount}   color="border-blue-500/30 text-blue-400" />
        <StatCard icon={FiTv}         title="Web Series"    value={stats.seriesCount}  color="border-purple-500/30 text-purple-400" />
        <StatCard icon={FiPlayCircle} title="Short Dramas"  value={stats.dramaCount}   color="border-pink-500/30 text-pink-400" />
        <StatCard icon={FiGrid}       title="Total Content" value={stats.totalContent} color="border-[rgba(212,175,55,0.4)] text-gold-neon" />
      </div>

      {/* ── Filters ── */}
      <div className="glass rounded-2xl border border-[rgba(212,175,55,0.12)] p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/20 px-4 py-2.5">
            <FiSearch className="text-gold-neon/70 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {["all", "movie", "series", "drama"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-gold-DEFAULT to-gold-neon text-black shadow-premium"
                    : "border border-[rgba(212,175,55,0.15)] bg-black/20 text-soft-gray hover:text-white hover:border-[rgba(212,175,55,0.3)]"
                }`}
              >
                {tab === "all" ? "All" : tab === "movie" ? "Movies" : tab === "series" ? "Series" : "Short Dramas"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-3xl border border-[rgba(212,175,55,0.1)] p-16 text-center">
          <FiGrid className="mx-auto h-10 w-10 text-soft-gray/40 mb-3" />
          <p className="text-soft-gray/80 text-sm">No content found. Try a different filter or add new content.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {filtered.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.4) }}
              className="group overflow-hidden rounded-3xl border border-[rgba(212,175,55,0.12)] bg-black/20 backdrop-blur-xl hover:border-[rgba(212,175,55,0.25)] hover:shadow-[0_0_30px_rgba(212,175,55,0.07)] transition-all duration-300"
            >
              {/* Poster */}
              <div className="relative h-[260px] overflow-hidden bg-black/40">
                {item.poster ? (
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-soft-gray/30">
                    {getTypeIcon(item.contentType)}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute left-3 top-3">{getTypeBadge(item.contentType)}</div>
                {item.isPremium && (
                  <div className="absolute right-3 top-3 rounded-full bg-gold-DEFAULT/90 px-2.5 py-0.5 text-[10px] font-bold text-black uppercase">
                    Premium
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="line-clamp-1 text-base font-bold text-white" title={item.title}>{item.title}</h3>
                <div className="mt-1 flex items-center gap-3 text-[11px] text-soft-gray/70">
                  {item.language && (
                    <span className="flex items-center gap-1"><FiGlobe className="h-3 w-3" /> {item.language}</span>
                  )}
                  {item.rating > 0 && (
                    <span className="flex items-center gap-1"><FiStar className="h-3 w-3 text-gold-soft" /> {item.rating}</span>
                  )}
                  {item.releaseYear && (
                    <span className="flex items-center gap-1"><FiCalendar className="h-3 w-3" /> {item.releaseYear}</span>
                  )}
                </div>
                {item.genre && item.genre.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.genre.slice(0, 3).map((g) => (
                      <span key={g} className="rounded px-1.5 py-0.5 text-[10px] bg-white/5 border border-white/8 text-soft-gray/80">{g}</span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setViewItem(item)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[rgba(212,175,55,0.18)] bg-black/20 py-2 text-xs font-semibold text-soft-gray hover:text-gold-soft hover:border-gold-DEFAULT transition-all"
                    title="View Details"
                  >
                    <FiEye className="h-3.5 w-3.5" /> View
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[rgba(212,175,55,0.18)] bg-black/20 py-2 text-xs font-semibold text-soft-gray hover:text-white hover:border-[rgba(212,175,55,0.4)] transition-all"
                    title="Edit Content"
                  >
                    <FiEdit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="flex items-center justify-center rounded-xl border border-red-500/20 bg-black/20 px-2.5 py-2 text-soft-gray hover:text-red-400 hover:border-red-500/50 transition-all"
                    title="Delete Content"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* VIEW MODAL */}
      <AnimatePresence>
        {viewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setViewItem(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-[rgba(212,175,55,0.25)] bg-black glass shadow-[0_0_60px_rgba(212,175,55,0.12)]"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold-DEFAULT via-gold-neon to-gold-soft" />

              {/* Close */}
              <button onClick={() => setViewItem(null)} className="absolute top-4 right-4 rounded-xl border border-white/10 bg-white/5 p-2 text-soft-gray hover:text-white hover:border-gold-DEFAULT/30 transition-all z-10">
                <FiX className="h-4 w-4" />
              </button>

              {/* Banner / Poster area */}
              <div className="relative h-48 overflow-hidden bg-black/40">
                {viewItem.banner || viewItem.poster ? (
                  <img
                    src={viewItem.banner || viewItem.poster}
                    alt={viewItem.title}
                    className="h-full w-full object-cover opacity-50"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-4 left-6 flex items-end gap-4">
                  {viewItem.poster && (
                    <img src={viewItem.poster} alt="" className="h-20 w-14 rounded-xl object-cover border border-[rgba(212,175,55,0.3)] shadow-lg" />
                  )}
                  <div>
                    <div className="mb-1">{getTypeBadge(viewItem.contentType)}</div>
                    <h2 className="text-xl font-extrabold text-white">{viewItem.title}</h2>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
                {viewItem.description && (
                  <p className="text-sm text-soft-gray/80 leading-relaxed">{viewItem.description}</p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {[
                    { label: "Language",     value: viewItem.language    },
                    { label: "Release Year", value: viewItem.releaseYear },
                    { label: "Duration",     value: viewItem.duration    },
                    { label: "Rating",       value: viewItem.rating ? `${viewItem.rating} / 10` : null },
                    { label: "Priority",     value: viewItem.priority    },
                    { label: "Content Type", value: viewItem.contentType?.toUpperCase() },
                  ].filter((r) => r.value).map(({ label, value }) => (
                    <div key={label} className="rounded-xl border border-white/5 bg-white/5 p-3">
                      <div className="text-soft-gray/60 text-[10px] uppercase font-semibold">{label}</div>
                      <div className="mt-0.5 text-white font-bold truncate">{value}</div>
                    </div>
                  ))}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {viewItem.isPremium && (
                    <span className="flex items-center gap-1 rounded-full bg-gold-DEFAULT/10 border border-gold-DEFAULT/30 px-3 py-1 text-xs font-bold text-gold-soft">
                      <FiShield className="h-3 w-3" /> Premium
                    </span>
                  )}
                  {viewItem.isComingSoon && (
                    <span className="flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-xs font-bold text-blue-400">
                      <FiCalendar className="h-3 w-3" /> Coming Soon
                    </span>
                  )}
                </div>

                {/* Genres */}
                {viewItem.genre?.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold text-soft-gray/60 uppercase mb-2 flex items-center gap-1"><FiTag className="h-3 w-3" /> Genres</div>
                    <div className="flex flex-wrap gap-1.5">
                      {viewItem.genre.map((g) => (
                        <span key={g} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-soft-gray">{g}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cast */}
                {viewItem.cast?.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold text-soft-gray/60 uppercase mb-2">Cast</div>
                    <div className="flex flex-wrap gap-3">
                      {viewItem.cast.map((member, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-3 py-2">
                          {member.image && <img src={member.image} alt={member.name} className="h-7 w-7 rounded-lg object-cover" />}
                          <span className="text-xs text-white font-semibold">{member.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-white/5 px-6 py-4 flex justify-end gap-3">
                <button onClick={() => { setViewItem(null); openEdit(viewItem); }} className="flex items-center gap-2 rounded-xl border border-[rgba(212,175,55,0.2)] bg-black/40 px-4 py-2 text-xs font-bold text-soft-gray hover:text-gold-soft hover:border-gold-DEFAULT/40 transition-all">
                  <FiEdit2 className="h-3.5 w-3.5" /> Edit
                </button>
                <button onClick={() => setViewItem(null)} className="rounded-xl border border-white/10 bg-black/40 px-5 py-2 text-xs font-bold text-soft-gray hover:text-white transition-all">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => !editSaving && setEditItem(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-[rgba(212,175,55,0.25)] bg-black glass shadow-[0_0_60px_rgba(212,175,55,0.12)]"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold-DEFAULT via-gold-neon to-gold-soft" />

              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
                <div>
                  <div className="text-[10px] font-semibold text-soft-gray/60 uppercase tracking-widest">Editing</div>
                  <h2 className="text-lg font-extrabold text-white mt-0.5 truncate max-w-md">{editItem.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                  {getTypeBadge(editItem.contentType)}
                  <button disabled={editSaving} onClick={() => setEditItem(null)} className="rounded-xl border border-white/10 bg-white/5 p-2 text-soft-gray hover:text-white transition-all ml-2 disabled:opacity-40">
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* LEFT COLUMN: Metadata & Settings */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gold-neon/90 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-[rgba(212,175,55,0.1)]">
                        <FiFilm className="h-4 w-4" /> Core Metadata
                      </h3>

                      <div>
                        <label className="block text-[10px] font-bold text-soft-gray/70 uppercase mb-1">Title *</label>
                        <input
                          type="text"
                          required
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-gold-DEFAULT transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-soft-gray/70 uppercase mb-1">Description</label>
                        <textarea
                          rows={3}
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-full rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/30 px-4 py-2.5 text-sm text-white outline-none resize-none focus:border-gold-DEFAULT transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-soft-gray/70 uppercase mb-1">Release Year</label>
                          <input
                            type="number"
                            value={editForm.releaseYear}
                            onChange={(e) => setEditForm({ ...editForm, releaseYear: e.target.value })}
                            className="w-full rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-gold-DEFAULT transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-soft-gray/70 uppercase mb-1">Duration</label>
                          <input
                            type="text"
                            value={editForm.duration}
                            onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                            className="w-full rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-gold-DEFAULT transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-soft-gray/70 uppercase mb-1">Language</label>
                          <input
                            type="text"
                            value={editForm.language}
                            onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                            className="w-full rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-gold-DEFAULT transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-soft-gray/70 uppercase mb-1">Rating (0–10)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={editForm.rating}
                            onChange={handleRatingChange}
                            onBlur={() => {
                              if (editForm.rating !== "" && parseFloat(editForm.rating) > 10) setEditForm(p => ({...p, rating: 10}));
                              if (editForm.rating !== "" && parseFloat(editForm.rating) < 0)  setEditForm(p => ({...p, rating: 0}));
                            }}
                            className="w-full rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-gold-DEFAULT transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-[10px] font-bold text-soft-gray/70 uppercase mb-1">Priority</label>
                          <input
                            type="number"
                            value={editForm.priority}
                            onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                            className="w-full rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-gold-DEFAULT transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-white/3 p-4 space-y-4">
                      <Toggle
                        checked={editForm.isPremium}
                        onChange={(v) => setEditForm({ ...editForm, isPremium: v })}
                        label="Premium Content"
                        sub="Requires active subscription plan"
                      />
                      <Toggle
                        checked={editForm.isComingSoon}
                        onChange={(v) => setEditForm({ ...editForm, isComingSoon: v })}
                        label="Coming Soon"
                        sub="Shows as upcoming, not yet watchable"
                      />
                      {editForm.isComingSoon && (
                        <div className="pt-2">
                          <label className="block text-[10px] font-bold text-soft-gray/70 uppercase mb-1 flex items-center gap-1.5">
                            <FiCalendar className="h-3 w-3" /> Scheduled Release Date
                          </label>
                          <input
                            type="date"
                            value={editForm.releaseDate}
                            onChange={(e) => setEditForm({ ...editForm, releaseDate: e.target.value })}
                            className="rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-gold-DEFAULT transition-all w-full"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gold-neon/90 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-[rgba(212,175,55,0.1)]">
                        <FiInfo className="h-4 w-4" /> Taxonomy
                      </h3>
                      <div>
                        <label className="block text-[10px] font-bold text-soft-gray/70 uppercase mb-1">Genres</label>
                        <div className="flex flex-wrap gap-2">
                          {[...new Set([...AVAILABLE_GENRES, ...editForm.selectedGenres.filter(g => !AVAILABLE_GENRES.includes(g))])].map((g) => {
                            const selected = editForm.selectedGenres.includes(g);
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
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="text"
                            value={customGenreInput}
                            onChange={(e) => setCustomGenreInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomGenre())}
                            placeholder="Add custom genre"
                            className="flex-1 bg-black/30 rounded-xl border border-[rgba(212,175,55,0.14)] px-3 py-2 text-xs text-white outline-none focus:border-gold-DEFAULT"
                          />
                          <button type="button" onClick={handleAddCustomGenre} className="px-3 py-2 text-xs font-bold text-gold-soft border border-[rgba(212,175,55,0.2)] rounded-xl bg-gold-DEFAULT/10 hover:bg-gold-DEFAULT/20">Add</button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-soft-gray/70 uppercase mb-1">Categories</label>
                        <div className="flex flex-wrap gap-2">
                          {[...new Set([...AVAILABLE_CATEGORIES, ...editForm.selectedCategories.filter(c => !AVAILABLE_CATEGORIES.includes(c))])].map((c) => {
                            const selected = editForm.selectedCategories.includes(c);
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
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="text"
                            value={customCategoryInput}
                            onChange={(e) => setCustomCategoryInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomCategory())}
                            placeholder="Add custom category"
                            className="flex-1 bg-black/30 rounded-xl border border-[rgba(212,175,55,0.14)] px-3 py-2 text-xs text-white outline-none focus:border-gold-DEFAULT"
                          />
                          <button type="button" onClick={handleAddCustomCategory} className="px-3 py-2 text-xs font-bold text-gold-soft border border-[rgba(212,175,55,0.2)] rounded-xl bg-gold-DEFAULT/10 hover:bg-gold-DEFAULT/20">Add</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Media & Cast */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gold-neon/90 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-[rgba(212,175,55,0.1)]">
                        <FiImage className="h-4 w-4" /> Media Files
                      </h3>
                      
                      {/* Media File Helpers */}
                      {[
                        { label: "Poster Image", key: "poster", max: "5MB", fileState: editForm.posterFile, urlState: editForm.posterUrl, icon: FiImage },
                        { label: "Hero Banner", key: "banner", max: "5MB", fileState: editForm.bannerFile, urlState: editForm.bannerUrl, icon: FiImage },
                        { label: "Trailer Clip", key: "trailer", max: "5GB", fileState: editForm.trailerFile, urlState: editForm.trailerUrl, icon: FiYoutube },
                        ...(editItem.contentType === "movie" ? [{ label: "Full Movie Video", key: "video", max: "5GB", fileState: editForm.videoFile, urlState: editForm.videoUrl, icon: FiPlayCircle }] : []),
                      ].map((media) => (
                        <div key={media.key} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-soft-gray/70 uppercase flex items-center gap-1">
                              <media.icon className="h-3 w-3" /> {media.label}
                            </label>
                            <span className="text-[9px] text-soft-gray/50 font-mono">Max {media.max}</span>
                          </div>
                          <div className="flex items-center gap-2 rounded-xl border border-[rgba(212,175,55,0.14)] bg-black/20 p-2 focus-within:border-gold-DEFAULT transition-all">
                            <div className="relative flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer overflow-hidden group shrink-0">
                              <FiUpload className="h-4 w-4 text-soft-gray group-hover:text-white transition-colors" />
                              <input
                                type="file"
                                accept={media.key === "trailer" || media.key === "video" ? "video/*" : "image/*"}
                                onChange={(e) => setEditForm({ ...editForm, [`${media.key}File`]: e.target.files?.[0] || null })}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              {media.fileState ? (
                                <div className="text-xs text-gold-neon font-bold truncate pr-2" title={media.fileState.name}>
                                  {media.fileState.name}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 px-1.5">
                                  <FiLink className="h-3 w-3 text-soft-gray/60" />
                                  <input
                                    type="text"
                                    value={media.urlState}
                                    onChange={(e) => setEditForm({ ...editForm, [`${media.key}Url`]: e.target.value })}
                                    placeholder="Paste URL here..."
                                    className="bg-transparent text-xs text-white outline-none placeholder:text-white/20 w-full"
                                  />
                                </div>
                              )}
                            </div>
                            {media.fileState && (
                              <button
                                type="button"
                                onClick={() => setEditForm({ ...editForm, [`${media.key}File`]: null })}
                                className="text-red-400 hover:text-red-300 p-1"
                              >
                                <FiTrash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-[rgba(212,175,55,0.1)]">
                        <h3 className="text-sm font-bold text-gold-neon/90 uppercase tracking-wider flex items-center gap-2">
                          <FiUsers className="h-4 w-4" /> Cast Members
                        </h3>
                        <button
                          type="button"
                          onClick={handleAddCastMember}
                          className="flex items-center gap-1.5 px-2 py-1 rounded border border-[rgba(212,175,55,0.2)] text-xs font-bold text-gold-soft hover:bg-gold-DEFAULT/10"
                        >
                          <FiPlus className="h-3 w-3" /> Add
                        </button>
                      </div>

                      {editForm.cast.length === 0 ? (
                        <div className="text-xs text-soft-gray/50 italic text-center py-4">No cast members added.</div>
                      ) : (
                        <div className="space-y-3">
                          {editForm.cast.map((member, index) => (
                            <div key={index} className="flex gap-3 items-start p-3 rounded-xl border border-[rgba(212,175,55,0.1)] bg-black/20">
                              {/* Avatar Preview */}
                              <div className="relative h-12 w-12 rounded-lg border border-[rgba(212,175,55,0.2)] overflow-hidden shrink-0 bg-black/40 flex items-center justify-center">
                                {member.imageFile ? (
                                  <img src={URL.createObjectURL(member.imageFile)} alt="" className="h-full w-full object-cover" />
                                ) : member.imageUrl ? (
                                  <img src={member.imageUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <FiUsers className="h-5 w-5 text-soft-gray/30" />
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                  <FiUpload className="h-4 w-4 text-white" />
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleCastChange(index, "imageFile", e.target.files?.[0] || null)}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                  />
                                </div>
                              </div>
                              <div className="flex-1 space-y-2 min-w-0">
                                <input
                                  type="text"
                                  value={member.name}
                                  onChange={(e) => handleCastChange(index, "name", e.target.value)}
                                  placeholder="Actor Name"
                                  className="w-full bg-transparent text-sm text-white font-semibold outline-none border-b border-white/10 pb-1 focus:border-gold-DEFAULT"
                                />
                                {!member.imageFile && (
                                  <div className="flex items-center gap-1.5">
                                    <FiLink className="h-3 w-3 text-soft-gray/60" />
                                    <input
                                      type="text"
                                      value={member.imageUrl}
                                      onChange={(e) => handleCastChange(index, "imageUrl", e.target.value)}
                                      placeholder="Image URL"
                                      className="w-full bg-transparent text-[10px] text-white outline-none placeholder:text-white/20"
                                    />
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveCastMember(index)}
                                className="text-red-400 hover:text-red-300 p-1"
                              >
                                <FiTrash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 border-t border-white/5 px-6 py-4">
                <button
                  disabled={editSaving}
                  onClick={() => setEditItem(null)}
                  className="rounded-2xl border border-white/10 bg-black/30 px-5 py-2 text-xs font-bold text-soft-gray hover:text-white transition-all disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  disabled={editSaving}
                  onClick={handleSaveEdit}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-gold-DEFAULT via-gold-soft to-gold-neon px-6 py-2 text-xs font-extrabold text-black shadow-premium hover:brightness-110 disabled:opacity-50 transition-all"
                >
                  {editSaving ? (
                    <><FiRefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving...</>
                  ) : (
                    <><FiSave className="h-3.5 w-3.5" /> Save Changes</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}