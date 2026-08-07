import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, Send, X, Trash2, Eye, RefreshCw, Link, Film, CreditCard } from "lucide-react";
import API from "../api/axios";
import "./Dashboard.css";
import "./Notifications.css";

// ── Type badge colours ─────────────────────────────────────────────────────
const TYPE_COLORS = {
  GENERAL:     { bg: "rgba(100,116,139,0.15)", color: "#94a3b8" },
  SYSTEM:      { bg: "rgba(59,130,246,0.15)",  color: "#3b82f6" },
  PLAN:        { bg: "rgba(139,92,246,0.15)",  color: "#8b5cf6" },
  PROMOTIONAL: { bg: "rgba(245,158,11,0.15)",  color: "#f59e0b" },
};

const EMPTY_FORM = {
  title:          "",
  message:        "",
  type:           "GENERAL",
  sendTo:         "All Users",
  userSearch:     "",
  attachmentType: "none",   // "none" | "content" | "plan"
  contentLinkType:"movie",  // "movie" | "series"
  contentSearch:  "",
  planSearch:     "",
};

// ── sendTo value → backend targetUserType mapping ─────────────────────────
const SEND_TO_MAP = {
  "All Users":       "ALL",
  "Subscribers Only":"SUBSCRIBERS",
  "Specific User":   "SPECIFIC_USER",
};

// ── Helper: resolve display target from a notification doc ─────────────────
const resolveTarget = (n) => {
  if (n.targetUser)       return n.targetUser?.name || n.targetUser?.email || "Specific User";
  if (n.targetUserType)   return n.targetUserType === "ALL" ? "All Users" : n.targetUserType;
  return "All Users";
};

// ── Helper: resolve linked content label ──────────────────────────────────
const resolveLinkedContent = (n) => {
  if (!n.metadata) return null;
  if (n.metadata.contentType && n.metadata.contentId) {
    const label = n.metadata.contentType.charAt(0).toUpperCase() + n.metadata.contentType.slice(1);
    const title = n.metadata.contentId?.title || "";
    return title ? `${label}: ${title}` : label;
  }
  if (n.metadata.planId) {
    const planName = n.metadata.planId?.name || "Plan";
    return `Plan: ${planName}`;
  }
  return null;
};

export default function NotificationsPage() {
  const [form, setForm]               = useState(EMPTY_FORM);
  const [loading, setLoading]         = useState(false);
  const [fetching, setFetching]       = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination]   = useState({ currentPage: 1, totalPages: 1, totalCount: 0, hasNextPage: false, hasPrevPage: false });
  const [currentPage, setCurrentPage] = useState(1);
  const LIMIT = 10;
  const [users, setUsers]             = useState([]);
  const [userDropOpen, setUserDropOpen]   = useState(false);
  const [selectedUser, setSelectedUser]   = useState(null);
  const [toast, setToast]             = useState(null);
  const [viewNotif, setViewNotif]     = useState(null);

  // ── Content search state ─────────────────────────────────────────────
  const [contentResults, setContentResults]   = useState([]);
  const [contentDropOpen, setContentDropOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const contentSearchTimer = useRef(null);
  const contentWrapRef     = useRef(null);
  const contentLoadedRef   = useRef(false); // tracks first-open load

  // ── Plan search state ────────────────────────────────────────────────
  const [planResults, setPlanResults]   = useState([]);
  const [planDropOpen, setPlanDropOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const planSearchTimer = useRef(null);
  const planWrapRef     = useRef(null);
  const planLoadedRef   = useRef(false);   // tracks first-open load

  // ── User dropdown ref ─────────────────────────────────────────────────
  const userWrapRef = useRef(null);
  const userSearchTimer = useRef(null);
  const userLoadedRef   = useRef(false);

  // ── Toast helper ──────────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ── Fetch notifications from backend ────────────────────────────────────
  const fetchNotifications = useCallback(async (page = 1) => {
    setFetching(true);
    try {
      const res = await API.get("/admin/notifications/", { params: { page, limit: LIMIT } });
      setNotifications(res.data.data || []);
      setPagination(res.data.pagination || { currentPage: page, totalPages: 1, totalCount: 0, hasNextPage: false, hasPrevPage: false });
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load notifications.", "error");
    } finally {
      setFetching(false);
    }
  }, []);

  // ── User search (debounced) ───────────────────────────────────────────
  const handleUserSearch = (value) => {
    setForm(prev => ({ ...prev, userSearch: value }));
    clearTimeout(userSearchTimer.current);
    userSearchTimer.current = setTimeout(async () => {
      try {
        const res = await API.get("/admin/users", {
          params: { q: value, limit: 20 }
        });
        setUsers(res.data.users || res.data.data || []);
        setUserDropOpen(true);
        userLoadedRef.current = true;
      } catch {
        setUsers([]);
      }
    }, 300);
  };

  // ── Load users on first focus ─────────────────────────────────────────
  const handleUserFocus = () => {
    if (selectedUser) return;
    setUserDropOpen(true);
    if (!userLoadedRef.current) {
      handleUserSearch("");
    }
  };

  useEffect(() => {
    fetchNotifications(currentPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when page changes (after initial mount)
  useEffect(() => {
    fetchNotifications(currentPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // ── Global click-outside: close any open dropdown ─────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userWrapRef.current && !userWrapRef.current.contains(e.target)) {
        setUserDropOpen(false);
      }
      if (contentWrapRef.current && !contentWrapRef.current.contains(e.target)) {
        setContentDropOpen(false);
      }
      if (planWrapRef.current && !planWrapRef.current.contains(e.target)) {
        setPlanDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Reset content state when contentLinkType changes ──────────────────
  useEffect(() => {
    if (form.attachmentType === "content") {
      setSelectedContent(null);
      setForm(prev => ({ ...prev, contentSearch: "" }));
      setContentResults([]);
      setContentDropOpen(false);
      contentLoadedRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.contentLinkType]);

  // ── Reset loaded flags when attachment type changes ───────────────────
  useEffect(() => {
    contentLoadedRef.current = false;
    planLoadedRef.current = false;
  }, [form.attachmentType]);

  // ── Content search (debounced) ─────────────────────────────────────────
  const handleContentSearch = (value) => {
    setForm(prev => ({ ...prev, contentSearch: value }));
    clearTimeout(contentSearchTimer.current);
    contentSearchTimer.current = setTimeout(async () => {
      try {
        const res = await API.get("/admin/notifications/search-content", {
          params: { q: value, type: form.contentLinkType }
        });
        setContentResults(res.data.data || []);
        setContentDropOpen(true);
        contentLoadedRef.current = true;
      } catch {
        setContentResults([]);
      }
    }, 300);
  };

  // ── Load all content on first focus ───────────────────────────────────
  const handleContentFocus = () => {
    if (selectedContent) return;
    setContentDropOpen(true);
    if (!contentLoadedRef.current) {
      handleContentSearch("");
    }
  };

  // ── Plan search (debounced) ────────────────────────────────────────────
  const handlePlanSearch = (value) => {
    setForm(prev => ({ ...prev, planSearch: value }));
    clearTimeout(planSearchTimer.current);
    planSearchTimer.current = setTimeout(async () => {
      try {
        const res = await API.get("/admin/notifications/search-plans", {
          params: { q: value }
        });
        setPlanResults(res.data.data || []);
        setPlanDropOpen(true);
        planLoadedRef.current = true;
      } catch {
        setPlanResults([]);
      }
    }, 300);
  };

  // ── Load all plans on first focus ─────────────────────────────────────
  const handlePlanFocus = () => {
    if (selectedPlan) return;
    setPlanDropOpen(true);
    if (!planLoadedRef.current) {
      handlePlanSearch("");
    }
  };

  // ── Form input change ─────────────────────────────────────────────────
  const ch = (e) => setForm({ ...form, [e.target.name]: e.target.value });


  // ── Send notification ─────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.message.trim()) {
      showToast("Please fill in title and message.", "error");
      return;
    }
    if (form.sendTo === "Specific User" && !selectedUser) {
      showToast("Please select a specific user.", "error");
      return;
    }
    if (form.attachmentType === "content" && !selectedContent) {
      showToast("Please select a content item.", "error");
      return;
    }
    if (form.attachmentType === "plan" && !selectedPlan) {
      showToast("Please select a subscription plan.", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title:      form.title.trim(),
        message:    form.message.trim(),
        type:       form.type,
        sendTo:     SEND_TO_MAP[form.sendTo] || "ALL",
        attachmentType: form.attachmentType,
        ...(form.sendTo === "Specific User" && selectedUser
          ? { targetUser: selectedUser._id || selectedUser.id }
          : {}),
        ...(form.attachmentType === "content" && selectedContent
          ? { contentId: selectedContent._id, contentType: form.contentLinkType }
          : {}),
        ...(form.attachmentType === "plan" && selectedPlan
          ? { planId: selectedPlan._id }
          : {}),
      };

      await API.post("/admin/notifications/send", payload);

      showToast("Notification sent successfully! 🎉");
      setForm(EMPTY_FORM);
      setSelectedUser(null);
      setSelectedContent(null);
      setSelectedPlan(null);
      setUsers([]);
      setContentResults([]);
      setPlanResults([]);
      userLoadedRef.current = false;
      setCurrentPage(1); // go back to first page after send
      fetchNotifications(1); // refresh table
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to send notification.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Clear form ────────────────────────────────────────────────────────
  const handleClear = () => {
    setForm(EMPTY_FORM);
    setSelectedUser(null);
    setSelectedContent(null);
    setSelectedPlan(null);
    setUsers([]);
    setContentResults([]);
    setPlanResults([]);
    userLoadedRef.current = false;
  };

  // ── Delete notification ───────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this notification?")) return;
    try {
      await API.delete(`/admin/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      showToast("Notification deleted.");
    } catch (err) {
      showToast(err.response?.data?.message || "Delete failed.", "error");
    }
  };

  // ── View notification & Mark as Read ───────────────────────────────────
  const handleView = async (notif) => {
    setViewNotif(notif);
    if (!notif.isRead) {
      try {
        await API.patch(`/admin/notifications/${notif._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error("Failed to mark as read", err);
      }
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="add-content-page notif-page">

      {/* ── Toast ── */}
      {toast && (
        <div className={`notif-toast ${toast.type}`}>{toast.msg}</div>
      )}

      {/* ── Header ── */}
      <div className="pg-header">
        <div>
          <h1 className="pg-title">
            <span className="pg-title-icon"><Bell size={26} /></span>
            Notifications
          </h1>
          <p className="pg-sub">Send and manage user notifications</p>
        </div>

        <div className="notif-stats-row">
          <div className="notif-stat-chip">
            <span className="notif-stat-val">{pagination.totalCount}</span>
            <span className="notif-stat-lbl">Total Sent</span>
          </div>
          <div className="notif-stat-chip s-green">
            <span className="notif-stat-val">{pagination.totalCount}</span>
            <span className="notif-stat-lbl">Delivered</span>
          </div>
          <div className="notif-stat-chip s-red">
            <span className="notif-stat-val">0</span>
            <span className="notif-stat-lbl">Failed</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════ SEND FORM ═══════════════════════ */}
      <form onSubmit={handleSend}>
        <div className="form-card notif-card">
          <h3>
            <span className="notif-card-icon"><Send size={16} /></span>
            Send Notification
          </h3>

          {/* Title */}
          <div className="notif-field-group">
            <label className="notif-label">Notification Title</label>
            <input
              className="form-input-styled notif-input"
              name="title"
              placeholder="Enter notification title"
              value={form.title}
              onChange={ch}
            />
          </div>

          {/* Message */}
          <div className="notif-field-group">
            <label className="notif-label">Message</label>
            <textarea
              className="form-input-styled notif-input notif-textarea"
              name="message"
              placeholder="Write notification message..."
              value={form.message}
              onChange={ch}
              rows={4}
            />
          </div>

          {/* Type + Send To */}
          <div className="notif-2col">
            <div className="notif-field-group">
              <label className="notif-label">Type</label>
              <select
                className="form-input-styled notif-input notif-select"
                name="type"
                value={form.type}
                onChange={ch}
              >
                <option value="GENERAL">GENERAL</option>
                <option value="SYSTEM">SYSTEM</option>
                <option value="PLAN">PLAN</option>
                <option value="PROMOTIONAL">PROMOTIONAL</option>
              </select>
            </div>

            <div className="notif-field-group">
              <label className="notif-label">Send To</label>
              <select
                className="form-input-styled notif-input notif-select"
                name="sendTo"
                value={form.sendTo}
                onChange={(e) => {
                  ch(e);
                  setSelectedUser(null);
                  setUserDropOpen(false);
                  userLoadedRef.current = false;
                  setUsers([]);
                }}
              >
                <option value="All Users">All Users</option>
                <option value="Specific User">Specific User</option>
                <option value="Subscribers Only">Subscribers Only</option>
              </select>
            </div>
          </div>

          {/* Specific User search (conditional) */}
          {form.sendTo === "Specific User" && (
            <div className="notif-field-group notif-fade-in">
              <label className="notif-label">Search User</label>
              <div className="notif-user-search-wrap" ref={userWrapRef}>
                <input
                  className="form-input-styled notif-input"
                  name="userSearch"
                  placeholder="Search by name / email / phone"
                  value={selectedUser ? (selectedUser.name || selectedUser.email) : form.userSearch}
                  onChange={(e) => {
                    setSelectedUser(null);
                    handleUserSearch(e.target.value);
                  }}
                  onFocus={handleUserFocus}
                  autoComplete="off"
                />
                {selectedUser && (
                  <button
                    type="button"
                    className="notif-user-clear"
                    onClick={() => {
                      setSelectedUser(null);
                      setForm(prev => ({ ...prev, userSearch: "" }));
                      userLoadedRef.current = false;
                      setUsers([]);
                    }}
                  >
                    <X size={14} />
                  </button>
                )}

                {userDropOpen && !selectedUser && (
                  <div className="notif-user-dropdown">
                    {users.length === 0 ? (
                      <div className="notif-user-empty">No users found</div>
                    ) : (
                      users.map((u) => (
                        <div
                          key={u._id || u.id}
                          className="notif-user-option"
                          onMouseDown={() => {
                            setSelectedUser(u);
                            setUserDropOpen(false);
                            setForm({ ...form, userSearch: u.name || u.email });
                          }}
                        >
                          <div className="notif-user-avatar">
                            {(u.name || u.email || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="notif-user-name">{u.name || "—"}</div>
                            <div className="notif-user-meta">
                              {u.email}{u.phone ? ` · ${u.phone}` : ""}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Attachment Type ── */}
          <div className="notif-field-group">
            <label className="notif-label">Attachment Type</label>
            <div className="notif-attachment-row">
              {[
                { value: "none",    label: "None",              icon: null },
                { value: "content", label: "Content",           icon: <Film size={14} /> },
                { value: "plan",    label: "Subscription Plan", icon: <CreditCard size={14} /> },
              ].map(opt => (
                <label key={opt.value} className={`notif-attach-option ${form.attachmentType === opt.value ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="attachmentType"
                    value={opt.value}
                    checked={form.attachmentType === opt.value}
                    onChange={ch}
                  />
                  {opt.icon}
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* ── Content Picker ── */}
          {form.attachmentType === "content" && (
            <div className="notif-fade-in">
              <div className="notif-field-group">
                <label className="notif-label">Link to Content</label>
                <select
                  className="form-input-styled notif-input notif-select"
                  name="contentLinkType"
                  value={form.contentLinkType}
                  onChange={ch}
                >
                  <option value="movie">Movie</option>
                  <option value="series">Series</option>
                </select>
              </div>

              <div className="notif-field-group">
                <label className="notif-label">
                  Search {form.contentLinkType === "movie" ? "Movie" : "Series"}
                </label>
                <div className="notif-user-search-wrap" ref={contentWrapRef}>
                  <input
                    className="form-input-styled notif-input"
                    placeholder={`Search ${form.contentLinkType} name`}
                    value={selectedContent ? selectedContent.title : form.contentSearch}
                    onChange={(e) => {
                      setSelectedContent(null);
                      handleContentSearch(e.target.value);
                    }}
                    onFocus={handleContentFocus}
                    autoComplete="off"
                  />
                  {selectedContent && (
                    <button
                      type="button"
                      className="notif-user-clear"
                      onClick={() => { setSelectedContent(null); setForm(prev => ({ ...prev, contentSearch: "" })); }}
                    >
                      <X size={14} />
                    </button>
                  )}

                  {contentDropOpen && !selectedContent && (
                    <div className="notif-user-dropdown">
                      {contentResults.length === 0 ? (
                        <div className="notif-user-empty">No results found</div>
                      ) : (
                        contentResults.map((item) => (
                          <div
                            key={item._id}
                            className="notif-user-option"
                            onMouseDown={() => {
                              setSelectedContent(item);
                              setContentDropOpen(false);
                              setForm(prev => ({ ...prev, contentSearch: item.title }));
                            }}
                          >
                            <div className="notif-user-avatar notif-content-avatar">
                              {item.title.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="notif-user-name">{item.title}</div>
                              <div className="notif-user-meta" style={{ textTransform: "capitalize" }}>
                                {form.contentLinkType}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Plan Picker ── */}
          {form.attachmentType === "plan" && (
            <div className="notif-field-group notif-fade-in">
              <label className="notif-label">Search Plan</label>
              <div className="notif-user-search-wrap" ref={planWrapRef}>
                <input
                  className="form-input-styled notif-input"
                  placeholder="Search plan name"
                  value={selectedPlan ? selectedPlan.name : form.planSearch}
                  onChange={(e) => {
                    setSelectedPlan(null);
                    handlePlanSearch(e.target.value);
                  }}
                  onFocus={handlePlanFocus}
                  autoComplete="off"
                />
                {selectedPlan && (
                  <button
                    type="button"
                    className="notif-user-clear"
                    onClick={() => { setSelectedPlan(null); setForm(prev => ({ ...prev, planSearch: "" })); }}
                  >
                    <X size={14} />
                  </button>
                )}

                {planDropOpen && !selectedPlan && (
                  <div className="notif-user-dropdown">
                    {planResults.length === 0 ? (
                      <div className="notif-user-empty">No plans found</div>
                    ) : (
                      planResults.map((plan) => (
                        <div
                          key={plan._id}
                          className="notif-user-option"
                          onMouseDown={() => {
                            setSelectedPlan(plan);
                            setPlanDropOpen(false);
                            setForm(prev => ({ ...prev, planSearch: plan.name }));
                          }}
                        >
                          <div className="notif-user-avatar notif-plan-avatar">
                            {plan.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="notif-user-name">{plan.name}</div>
                            <div className="notif-user-meta">
                              ₹{plan.price} · {plan.duration} days
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}


          {/* Buttons */}
          <div className="notif-btn-row">
            <button
              type="submit"
              className="btn-lg notif-send-btn"
              disabled={loading}
            >
              {loading ? <span className="notif-spinner" /> : <Send size={16} />}
              {loading ? "Sending..." : "Send Notification"}
            </button>

            <button
              type="button"
              className="btn notif-clear-btn"
              onClick={handleClear}
            >
              <X size={15} />
              Clear
            </button>
          </div>
        </div>
      </form>

      {/* ═══════════════════════ RECENT TABLE ═══════════════════════ */}
      <div className="content-box">
        <h3>
          <span className="notif-card-icon" style={{ color: "var(--orange)" }}>
            <Bell size={16} />
          </span>
          Recent Notifications
          <span className="notif-count-badge">{pagination.totalCount}</span>

          {/* Refresh button */}
          <button
            className="icon-btn view"
            title="Refresh"
            onClick={() => { setCurrentPage(1); fetchNotifications(1); }}
            style={{ marginLeft: "auto" }}
            type="button"
          >
            <RefreshCw size={14} className={fetching ? "notif-spin-icon" : ""} />
          </button>
        </h3>

        <div className="tbl-wrap">
          {fetching ? (
            <div className="empty-state">
              <span className="notif-spinner" style={{ margin: "0 auto" }} />
              <p style={{ marginTop: 14 }}>Loading notifications…</p>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Target</th>
                  <th>Attachment</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {notifications.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <div style={{ fontSize: "2rem" }}>🔔</div>
                        <p>No notifications sent yet</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  notifications.map((n) => (
                    <tr key={n._id} style={{ opacity: n.isRead ? 0.75 : 1, background: !n.isRead ? "rgba(255,255,255,0.02)" : "transparent" }}>
                      <td>
                        <span className="notif-row-title" style={{ fontWeight: !n.isRead ? "bold" : "normal" }}>{n.title}</span>
                      </td>

                      <td>
                        <span
                          className="badge"
                          style={{
                            background: TYPE_COLORS[n.type]?.bg  || TYPE_COLORS.GENERAL.bg,
                            color:      TYPE_COLORS[n.type]?.color || TYPE_COLORS.GENERAL.color,
                          }}
                        >
                          {n.type || "GENERAL"}
                        </span>
                      </td>

                      <td>
                        <span className="notif-target">{resolveTarget(n)}</span>
                      </td>

                      <td>
                        {resolveLinkedContent(n) ? (
                          <span className="notif-attachment-chip">
                            <Link size={11} />
                            {resolveLinkedContent(n)}
                          </span>
                        ) : (
                          <span className="notif-no-attach">—</span>
                        )}
                      </td>

                      <td>
                        <span className="notif-date">
                          {new Date(n.createdAt || n.sentAt).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </span>
                      </td>

                      <td>
                        <span className={`badge ${n.isRead ? "" : "badge-active"}`} style={{ 
                          background: n.isRead ? "rgba(100,116,139,0.15)" : "rgba(16, 185, 129, 0.15)",
                          color: n.isRead ? "#94a3b8" : "#10b981"
                        }}>
                          {n.isRead ? "Read" : "Unread"}
                        </span>
                      </td>

                      <td>
                        <div className="tbl-actions" style={{ justifyContent: "center" }}>
                          <button 
                            className="icon-btn view" 
                            title="View Details"
                            type="button"
                            onClick={() => handleView(n)}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            className="icon-btn del"
                            title="Delete"
                            type="button"
                            onClick={() => handleDelete(n._id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination Bar ── */}
        {pagination.totalPages > 1 && (
          <div className="notif-pagination">
            <button
              className="notif-pg-btn"
              disabled={!pagination.hasPrevPage || fetching}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              ← Prev
            </button>

            <div className="notif-pg-pages">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.currentPage) <= 2)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "..." ? (
                    <span key={`ellipsis-${idx}`} className="notif-pg-ellipsis">…</span>
                  ) : (
                    <button
                      key={p}
                      className={`notif-pg-num ${pagination.currentPage === p ? "active" : ""}`}
                      onClick={() => setCurrentPage(p)}
                      disabled={fetching}
                    >
                      {p}
                    </button>
                  )
                )
              }
            </div>

            <button
              className="notif-pg-btn"
              disabled={!pagination.hasNextPage || fetching}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next →
            </button>
          </div>
        )}

        {/* Page info text */}
        {pagination.totalCount > 0 && (
          <div className="notif-pg-info">
            Showing {((pagination.currentPage - 1) * LIMIT) + 1}–{Math.min(pagination.currentPage * LIMIT, pagination.totalCount)} of {pagination.totalCount} notifications
          </div>
        )}
      </div>

      {/* ── View Detail Modal ── */}
      {viewNotif && (
        <div className="profile-overlay" onClick={() => setViewNotif(null)}>
          <div className="profile-card notif-view-modal" onClick={e => e.stopPropagation()} style={{ width: "440px", padding: 0 }}>

            {/* Header */}
            <div className="profile-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "8px" }}>
                🔔 Notification Details
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.5px" }}>ADMIN PANEL</span>
              </h2>
              <button className="close-btn" onClick={() => setViewNotif(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="profile-body" style={{ padding: "20px", textAlign: "left", marginTop: 0, maxHeight: "70vh", overflowY: "auto" }}>

              {/* Type badge + title + sent time */}
              <div style={{ marginBottom: "16px" }}>
                <span className="badge" style={{
                  background: TYPE_COLORS[viewNotif.type]?.bg || TYPE_COLORS.GENERAL.bg,
                  color: TYPE_COLORS[viewNotif.type]?.color || TYPE_COLORS.GENERAL.color,
                  marginBottom: "10px",
                  display: "inline-block",
                  textTransform: "uppercase",
                  fontSize: "0.72rem",
                  letterSpacing: "0.6px"
                }}>
                  {viewNotif.type || "GENERAL"}
                </span>
                <h3 style={{ fontSize: "1.25rem", margin: "0 0 4px", lineHeight: 1.3, fontWeight: 700 }}>{viewNotif.title}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: 0 }}>
                  Sent on {new Date(viewNotif.createdAt || viewNotif.sentAt).toLocaleString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              </div>

              {/* Message body */}
              <div style={{
                background: "var(--bg)",
                padding: "14px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                color: "var(--text)",
                fontSize: "0.93rem",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                marginBottom: "16px"
              }}>
                {viewNotif.message}
              </div>

              {/* Target + Read Status — 2-col bordered cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div className="notif-detail-card">
                  <span className="notif-detail-label">👥 Target User(s)</span>
                  <div className="notif-detail-value">{resolveTarget(viewNotif)}</div>
                </div>
                <div className="notif-detail-card">
                  <span className="notif-detail-label">📩 Read Status</span>
                  <div style={{ marginTop: "6px" }}>
                    <span style={{
                      background: viewNotif.isRead ? "rgba(100,116,139,0.18)" : "rgba(16,185,129,0.15)",
                      color: viewNotif.isRead ? "#94a3b8" : "#10b981",
                      padding: "3px 12px",
                      borderRadius: "20px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px"
                    }}>
                      <span style={{
                        width: "6px", height: "6px", borderRadius: "50%",
                        background: viewNotif.isRead ? "#94a3b8" : "#10b981",
                        display: "inline-block"
                      }} />
                      {viewNotif.isRead ? "Read" : "Unread"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Linked Content */}
              {resolveLinkedContent(viewNotif) && (
                <div className="notif-detail-card" style={{ marginBottom: "4px" }}>
                  <span className="notif-detail-label">🎬 Linked Content</span>
                  <div className="notif-detail-value" style={{ textTransform: "capitalize" }}>
                    {resolveLinkedContent(viewNotif)}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
              <button className="btn" onClick={() => setViewNotif(null)}>Close</button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
