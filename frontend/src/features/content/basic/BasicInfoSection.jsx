import {
  Star,
  Globe,
  Calendar,
  Clock,
  Tag,
  Layers,
  Rocket,
  Lock,
  ShieldAlert,
  ArrowUpCircle,
  Eye,
} from "lucide-react";
import CategoryPicker from "../../../components/CategoryPicker";
import "./BasicInfo.css";

/* ── Main Section ──────────────────────────────────────── */
export default function BasicInfoSection({ form, ch }) {
  // category is stored as array in form; provide a setter via synthetic event
  const handleCategoryChange = (slugArray) => {
    ch({ target: { name: "category", value: slugArray } });
  };

  // Normalize: may come in as string or array
  const selectedCats = Array.isArray(form.category)
    ? form.category
    : form.category
    ? [form.category]
    : [];

  return (
    <div className="premium-card">
      <h3 className="section-title">
        <span>
          <Star size={18} />
        </span>
        Basic Information
      </h3>

      <div className="form-2col" style={{ marginBottom: 20 }}>
        <div className="form-row form-full">
          <label className="form-label">Content Title *</label>
          <input
            className="form-input-styled"
            name="title"
            placeholder="e.g. Inception"
            onChange={ch}
            value={form.title}
            required
          />
        </div>

        <div className="form-row form-full">
          <label className="form-label">Synopsis / Description *</label>
          <textarea
            className="form-input-styled"
            name="description"
            placeholder="A brief summary of the plot..."
            rows={3}
            onChange={ch}
            value={form.description}
            required
          />
        </div>
      </div>

      <div className="form-grid-3">
        <div className="form-row">
          <label className="form-label">
            <Globe size={14} style={{ marginRight: 4 }} />
            Language
          </label>
          <input
            className="form-input-styled"
            name="language"
            placeholder="English, Hindi, etc."
            onChange={ch}
            value={form.language}
          />
        </div>

        <div className="form-row">
          <label className="form-label">
            <Calendar size={14} style={{ marginRight: 4 }} />
            Release Year
          </label>
          <input
            className="form-input-styled"
            name="releaseYear"
            type="number"
            placeholder="2024"
            onChange={ch}
            value={form.releaseYear}
          />
        </div>

        <div className="form-row">
          <label className="form-label">
            <Clock size={14} style={{ marginRight: 4 }} />
            {form.type === "movie" ? "Duration" : "Avg. Ep Duration"}
          </label>
          <input
            className="form-input-styled"
            name="duration"
            placeholder="e.g. 2h 15m"
            onChange={ch}
            value={form.duration}
          />
        </div>

        <div className="form-row">
          <label className="form-label">
            <Tag size={14} style={{ marginRight: 4 }} />
            Genres
          </label>
          <input
            className="form-input-styled"
            name="genre"
            placeholder="Action, Sci-Fi, Drama"
            onChange={ch}
            value={form.genre}
          />
        </div>

        {/* ── Dynamic Category Multi-select (full width) ── */}
        <div className="form-row" style={{ gridColumn: "1 / -1" }}>
          <label className="form-label">
            <Layers size={14} style={{ marginRight: 4 }} />
            Categories
          </label>
          <CategoryPicker
            selected={selectedCats}
            onChange={handleCategoryChange}
          />
        </div>

        <div className="form-row">
          <label className="form-label">
            <Star size={14} style={{ marginRight: 4 }} />
            IMDb Rating (0 - 10)
          </label>
          <input
            className="form-input-styled"
            name="rating"
            type="number"
            step="0.1"
            min="0"
            max="10"
            placeholder="8.5"
            onChange={ch}
            value={form.rating}
          />
        </div>

        <div className="form-row">
          <label className="form-label">
            <ArrowUpCircle size={14} style={{ marginRight: 4 }} />
            Priority (0 = Auto-assign)
          </label>
          <input
            className="form-input-styled"
            name="priority"
            type="number"
            min="0"
            placeholder="0 = Automatic (bottom), manually enter 1, 2, 3... to rank"
            onChange={ch}
            value={form.priority}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          marginTop: 24,
        }}
      >
        <label
          className="checkbox-row"
          style={{ flex: 1, minWidth: "200px" }}
        >
          <input
            type="checkbox"
            name="isComingSoon"
            onChange={ch}
            checked={form.isComingSoon}
          />
          <span>
            <Rocket size={16} style={{ marginRight: 8 }} />
            Coming Soon
          </span>
        </label>

        <label
          className="checkbox-row"
          style={{
            flex: 1,
            minWidth: "200px",
            background: "rgba(229, 9, 20, 0.1)",
            borderColor: "rgba(229, 9, 20, 0.2)",
          }}
        >
          <input
            type="checkbox"
            name="isPremium"
            onChange={ch}
            checked={form.isPremium}
          />
          <span style={{ color: "var(--primary)" }}>
            <Lock size={16} style={{ marginRight: 8 }} />
            Premium Content
          </span>
        </label>

        <label
          className="checkbox-row"
          style={{
            flex: 1,
            minWidth: "200px",
            background: "rgba(245, 158, 11, 0.12)",
            borderColor: "rgba(245, 158, 11, 0.25)",
          }}
        >
          <input
            type="checkbox"
            name="is18Plus"
            onChange={ch}
            checked={form.is18Plus}
          />
          <span style={{ color: "var(--orange)" }}>
            <ShieldAlert size={16} style={{ marginRight: 8 }} />
            18+ Content Warning
          </span>
        </label>

        <label
          className="checkbox-row"
          style={{
            flex: 1,
            minWidth: "200px",
            background: form.isPublished !== false ? "rgba(6, 214, 160, 0.1)" : "rgba(160, 160, 160, 0.08)",
            borderColor: form.isPublished !== false ? "rgba(6, 214, 160, 0.25)" : "rgba(160, 160, 160, 0.2)",
          }}
        >
          <input
            type="checkbox"
            name="isPublished"
            onChange={ch}
            checked={form.isPublished !== false}
          />
          <span style={{ color: form.isPublished !== false ? "var(--green)" : "var(--text-muted)" }}>
            <Eye size={16} style={{ marginRight: 8 }} />
            {form.isPublished !== false ? "Published" : "Draft (Unpublished)"}
          </span>
        </label>
      </div>

      {form.is18Plus && (
        <p
          style={{
            marginTop: 12,
            color: "var(--orange)",
            fontSize: "0.85rem",
          }}
        >
          Warning: this title will be marked for adult audiences.
        </p>
      )}

      {form.isComingSoon && (
        <div
          className="form-row"
          style={{ marginTop: 20, animation: "pageIn 0.3s ease" }}
        >
          <label className="form-label">Scheduled Release Date & Time</label>
          <input
            className="form-input-styled"
            type="datetime-local"
            name="releaseDate"
            onChange={ch}
            value={form.releaseDate}
            required
          />
        </div>
      )}
    </div>
  );
}
