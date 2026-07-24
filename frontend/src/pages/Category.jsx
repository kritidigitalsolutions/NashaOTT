import { useState, useEffect, useCallback } from "react";
import {
  Layers, Plus, Edit2, Trash2, X, Check, Search,
  ToggleLeft, ToggleRight, ChevronUp, ChevronDown,
  AlertTriangle, Hash, ArrowUpDown,
} from "lucide-react";
import {
  fetchAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../features/services/category.service";
import "./Dashboard.css";
import "./Category.css";

const EMPTY_FORM = { name: "", priority: 0, isActive: true };

export default function Category() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [total, setTotal]           = useState(0);

  const [modal, setModal]       = useState(null); // "add" | "edit" | "delete"
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError]     = useState("");

  /* ── Fetch ── */
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (search.trim()) params.search = search.trim();
      if (filterActive !== "all") params.isActive = filterActive === "active";
      const res = await fetchAdminCategories(params);
      setCategories(res.categories || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Fetch categories error:", err);
    }
    setLoading(false);
  }, [search, filterActive]);

  useEffect(() => {
    const t = setTimeout(fetchCategories, 300);
    return () => clearTimeout(t);
  }, [fetchCategories]);

  /* ── Modal helpers ── */
  const openAdd = () => { setForm(EMPTY_FORM); setFormError(""); setModal("add"); };
  const openEdit = (cat) => {
    setSelected(cat);
    setForm({ name: cat.name, priority: cat.priority, isActive: cat.isActive });
    setFormError(""); setModal("edit");
  };
  const openDelete = (cat) => { setSelected(cat); setModal("delete"); };
  const closeModal = () => { setModal(null); setSelected(null); setFormError(""); };

  const ch = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  /* ── CRUD ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError("Category name is required."); return; }
    setFormLoading(true); setFormError("");
    try {
      if (modal === "add") {
        await createCategory({ name: form.name.trim(), priority: Number(form.priority) || 0, isActive: form.isActive });
      } else {
        await updateCategory(selected._id, { name: form.name.trim(), priority: Number(form.priority) || 0, isActive: form.isActive });
      }
      await fetchCategories();
      closeModal();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Something went wrong.");
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await deleteCategory(selected._id);
      await fetchCategories();
      closeModal();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to delete category.");
    }
    setFormLoading(false);
  };

  const handleToggleActive = async (cat) => {
    try {
      await updateCategory(cat._id, { isActive: !cat.isActive });
      fetchCategories();
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  const handlePriorityNudge = async (cat, delta) => {
    const newPriority = Math.max(0, (cat.priority || 0) + delta);
    try {
      await updateCategory(cat._id, { priority: newPriority });
      fetchCategories();
    } catch (err) {
      console.error("Priority nudge error:", err);
    }
  };

  const activeCount   = categories.filter(c => c.isActive).length;
  const inactiveCount = categories.filter(c => !c.isActive).length;

  return (
    <div className="page-section">

      {/* ── Header ── */}
      <div className="pg-header">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="cat-header-icon">
            <Layers size={22} />
          </div>
          <div>
            <div className="pg-title" style={{ fontSize: "1.6rem" }}>Categories</div>
            <div className="pg-sub">Manage content categories displayed across the platform</div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAdd} style={{ height: 42 }}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="cat-stats-row">
        <div className="cat-stat-pill total">
          <span className="cat-stat-num">{total}</span>
          <span className="cat-stat-label">Total</span>
        </div>
        <div className="cat-stat-pill active">
          <span className="cat-stat-num">{activeCount}</span>
          <span className="cat-stat-label">Active</span>
        </div>
        <div className="cat-stat-pill inactive">
          <span className="cat-stat-num">{inactiveCount}</span>
          <span className="cat-stat-label">Inactive</span>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="cat-toolbar">
        <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
          <Search size={15} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch("")}>
              <X size={13} />
            </button>
          )}
        </div>
        <div className="cat-filter-tabs">
          {["all", "active", "inactive"].map((f) => (
            <button
              key={f}
              className={`cat-filter-tab ${filterActive === f ? "selected" : ""}`}
              onClick={() => setFilterActive(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="cat-table-card">
        {loading ? (
          <div className="cat-loader">
            <div className="cat-spin" />
            <span style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>Loading categories...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="cat-empty">
            <div className="cat-empty-icon"><Layers size={28} /></div>
            <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>No categories found</p>
            <p style={{ fontSize: "0.82rem" }}>
              {search ? `No match for "${search}"` : "Create your first category to get started."}
            </p>
            {!search && (
              <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={openAdd}>
                <Plus size={14} /> Add First Category
              </button>
            )}
          </div>
        ) : (
          <table className="cat-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Category</th>
                <th>Slug</th>
                <th style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <ArrowUpDown size={12} /> Priority
                </th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, idx) => (
                <tr key={cat._id} className="cat-row">
                  <td className="cat-idx">{idx + 1}</td>
                  <td>
                    <div className="cat-name-cell">
                      <div className="cat-avatar">{cat.name.charAt(0)}</div>
                      <span>{cat.name}</span>
                    </div>
                  </td>
                  <td><code className="cat-slug">{cat.slug}</code></td>
                  <td>
                    <div className="cat-priority-cell">
                      <div className="cat-nudge-group">
                        <button className="cat-nudge" onClick={() => handlePriorityNudge(cat, 5)} title="Increase priority">
                          <ChevronUp size={11} />
                        </button>
                        <button className="cat-nudge" onClick={() => handlePriorityNudge(cat, -5)} title="Decrease priority">
                          <ChevronDown size={11} />
                        </button>
                      </div>
                      <span className="cat-priority-badge">{cat.priority}</span>
                    </div>
                  </td>
                  <td>
                    <button
                      className={`cat-toggle-btn ${cat.isActive ? "active" : "inactive"}`}
                      onClick={() => handleToggleActive(cat)}
                    >
                      {cat.isActive
                        ? <><ToggleRight size={16} /> Active</>
                        : <><ToggleLeft  size={16} /> Inactive</>
                      }
                    </button>
                  </td>
                  <td className="cat-date">
                    {new Date(cat.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </td>
                  <td>
                    <div className="cat-actions">
                      <button className="icon-btn edit" title="Edit category" onClick={() => openEdit(cat)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="icon-btn del" title="Delete category" onClick={() => openDelete(cat)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ══════════ ADD / EDIT MODAL ══════════ */}
      {(modal === "add" || modal === "edit") && (
        <div className="cat-overlay" onClick={closeModal}>
          <div className="cat-modal-box" onClick={(e) => e.stopPropagation()}>

            <div className="cat-modal-header">
              <div className="cat-modal-title-row">
                <div className="cat-modal-icon gold">
                  {modal === "add" ? <Plus size={18} /> : <Edit2 size={17} />}
                </div>
                <div>
                  <h3>{modal === "add" ? "Add New Category" : "Edit Category"}</h3>
                  <p>{modal === "add" ? "Create a new content category" : `Editing "${selected?.name}"`}</p>
                </div>
              </div>
              <button className="cat-modal-close" onClick={closeModal}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="cat-modal-body">
                {formError && (
                  <div className="cat-form-error">
                    <AlertTriangle size={15} /> {formError}
                  </div>
                )}

                <div className="cat-field">
                  <label className="cat-field-label">
                    Category Name <span className="req">*</span>
                  </label>
                  <input
                    className="cat-field-input"
                    name="name"
                    placeholder="e.g. Trending, Action, Romance..."
                    value={form.name}
                    onChange={ch}
                    autoFocus
                  />
                </div>

                <div className="cat-field">
                  <label className="cat-field-label">
                    <Hash size={11} /> Priority
                  </label>
                  <input
                    className="cat-field-input"
                    name="priority"
                    type="number"
                    min="0"
                    placeholder="e.g. 100 — higher number = shown first"
                    value={form.priority}
                    onChange={ch}
                  />
                  <span className="cat-field-hint">
                    Higher value = appears first in category listings
                  </span>
                </div>

                <label className="cat-active-toggle" style={{ cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={ch}
                  />
                  <div className="cat-active-toggle-info">
                    <span className="cat-active-toggle-title">Active Category</span>
                    <span className="cat-active-toggle-sub">Visible to users across the platform</span>
                  </div>
                  <div className={`cat-switch ${form.isActive ? "on" : ""}`} />
                </label>
              </div>

              <div className="cat-modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading
                    ? "Saving..."
                    : <><Check size={15} /> {modal === "add" ? "Create Category" : "Save Changes"}</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ DELETE MODAL ══════════ */}
      {modal === "delete" && (
        <div className="cat-overlay" onClick={closeModal}>
          <div className="cat-modal-box sm danger" onClick={(e) => e.stopPropagation()}>

            <div className="cat-modal-header">
              <div className="cat-modal-title-row">
                <div className="cat-modal-icon red">
                  <Trash2 size={17} />
                </div>
                <div>
                  <h3>Delete Category</h3>
                  <p>This action is permanent</p>
                </div>
              </div>
              <button className="cat-modal-close" onClick={closeModal}>
                <X size={16} />
              </button>
            </div>

            <div className="cat-delete-body">
              {formError && (
                <div className="cat-form-error">
                  <AlertTriangle size={15} /> {formError}
                </div>
              )}
              <div className="cat-delete-warning-box">
                <div className="cat-delete-warning-icon">
                  <AlertTriangle size={18} />
                </div>
                <div className="cat-delete-text">
                  <p>
                    You are about to permanently delete <strong>"{selected?.name}"</strong>.
                    Any content using this category will lose this tag.
                  </p>
                  <p className="cat-delete-caution">⚠ This action cannot be undone.</p>
                </div>
              </div>
            </div>

            <div className="cat-modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn-cat-danger" onClick={handleDelete} disabled={formLoading}>
                {formLoading ? "Deleting..." : <><Trash2 size={14} /> Delete Category</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
