import { useState, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { fetchActiveCategories } from "../features/services/category.service";
import "./CategoryPicker.css";

/**
 * Reusable multi-select category picker.
 *
 * Props:
 *  - selected: string[]   — array of selected category slugs
 *  - onChange: (slugs: string[]) => void
 *  - placeholder?: string
 */
export default function CategoryPicker({ selected = [], onChange, placeholder = "Select categories…" }) {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchActiveCategories()
      .then((res) => setCategories(res.categories || []))
      .catch(console.error);
  }, []);

  const toggle = (slug) => {
    const next = selected.includes(slug)
      ? selected.filter((s) => s !== slug)
      : [...selected, slug];
    onChange(next);
  };

  const remove = (slug, e) => {
    e.stopPropagation();
    onChange(selected.filter((s) => s !== slug));
  };

  const selectedNames = selected.map(
    (slug) => categories.find((c) => c.slug === slug)?.name || slug
  );

  return (
    <div className="cp-wrapper">
      {/* Trigger */}
      <div
        className={`cp-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((p) => !p)}
        tabIndex={0}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
        }}
      >
        <div className="cp-chips">
          {selected.length === 0 ? (
            <span className="cp-placeholder">{placeholder}</span>
          ) : (
            selectedNames.map((name, i) => (
              <span key={i} className="cp-chip">
                {name}
                <button
                  type="button"
                  className="cp-chip-remove"
                  onMouseDown={(e) => remove(selected[i], e)}
                >
                  <X size={11} />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown size={15} className={`cp-arrow ${open ? "rotated" : ""}`} />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="cp-dropdown">
          {categories.length === 0 ? (
            <div className="cp-empty">No active categories found</div>
          ) : (
            categories.map((cat) => {
              const isSel = selected.includes(cat.slug);
              return (
                <div
                  key={cat._id}
                  className={`cp-option ${isSel ? "selected" : ""}`}
                  onMouseDown={(e) => { e.preventDefault(); toggle(cat.slug); }}
                >
                  <span>{cat.name}</span>
                  {isSel && <Check size={14} className="cp-check" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
