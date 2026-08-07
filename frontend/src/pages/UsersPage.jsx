import { useEffect, useState } from "react";
import API, { API_BASE_URL } from "../api/axios";
import { Users, RefreshCw, User, CheckCircle, AlertCircle, Search, Loader, Eye, Trash2, X, UserX, ShieldAlert } from "lucide-react";
import "./Dashboard.css";
import "./Notifications.css";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [stats, setStats] = useState({ total: 0, active: 0, blocked: 0 });

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const serverUrl = API_BASE_URL.replace("/api", "").replace(/\/+$/, "");
    const cleanPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
    return `${serverUrl}/${cleanPath}`;
  };

  const fetchUsers = async (page = 1, searchQuery = "") => {
    setLoading(true);
    try {
      const res = await API.get("/admin/users", {
        params: { page, limit: 10, q: searchQuery }
      });
      setUsers(res.data.users || []);
      setPagination(res.data.pagination || {
        currentPage: page,
        totalPages: 1,
        totalCount: 0,
        hasNextPage: false,
        hasPrevPage: false
      });
      setStats({
        total: res.data.totalCount || 0,
        active: res.data.activeCount || 0,
        blocked: res.data.blockedCount || 0
      });
      setCurrentPage(page);
    } catch {
      setUsers([]);
    }
    setLoading(false);
  };

  // Debounced search query
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers(1, search);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;
    try {
      await API.delete(`/admin/users/${id}`);
      setUsers(p => p.filter(u => u._id !== id));
      fetchUsers(currentPage, search);
    } catch { alert("Failed to delete"); }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("WARNING: Are you sure you want to permanently delete ALL users from the database? This action is high-risk, permanent, and cannot be undone!")) {
      return;
    }
    const doubleCheck = window.prompt("Please type 'DELETE ALL' to confirm:");
    if (!doubleCheck || doubleCheck.trim().toUpperCase() !== "DELETE ALL") {
      alert("Confirmation mismatch. Operation cancelled.");
      return;
    }

    setLoading(true);
    try {
      await API.delete("/admin/users/delete-all");
      alert("All users deleted successfully.");
      fetchUsers(1, "");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete all users.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (id, isBlocked) => {
    const actionText = isBlocked ? "unblock" : "block";
    if (!window.confirm(`Are you sure you want to ${actionText} this user?`)) return;

    try {
      const res = await API.patch(`/admin/users/${id}/block`);
      alert(res.data.message || `User ${actionText}ed successfully.`);
      setUsers(p => p.map(u => u._id === id ? { ...u, isBlocked: !isBlocked } : u));
      if (selected?._id === id) {
        setSelected(prev => ({ ...prev, isBlocked: !isBlocked }));
      }
      fetchUsers(currentPage, search);
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${actionText} user.`);
    }
  };

  return (
    <div className="page-section">
      {/* Header */}
      <div className="pg-header">
        <div>
          <h1 className="pg-title"><Users size={28} style={{ display: "inline-block", marginRight: 8 }} /> User Management</h1>
          <p className="pg-sub">View, search, and manage all platform users</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-primary" onClick={() => fetchUsers(currentPage, search)}>
            <RefreshCw size={16} style={{ display: "inline-block", marginRight: 6 }} /> Refresh
          </button>
          <button 
            className="btn btn-danger-premium" 
            onClick={handleDeleteAll}
            disabled={loading}
          >
            <Trash2 size={16} style={{ display: "inline-block", marginRight: 6 }} /> Delete All
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card s-green">
          <div className="stat-icon"><User size={24} /></div>
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{loading ? "..." : stats.total}</div>
        </div>
        <div className="stat-card s-blue">
          <div className="stat-icon"><CheckCircle size={24} /></div>
          <div className="stat-label">Active</div>
          <div className="stat-value">{loading ? "..." : stats.active}</div>
        </div>
        <div className="stat-card s-red">
          <div className="stat-icon"><AlertCircle size={24} /></div>
          <div className="stat-label">Blocked</div>
          <div className="stat-value">{loading ? "..." : stats.blocked}</div>
        </div>
      </div>

      {/* Table Card */}
      <div className="content-box">
        <div className="search-row" style={{ marginBottom: 20 }}>
          <div className="search-field">
            <Search size={18} />
            <input placeholder="Search by name or email..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><p><Loader size={20} style={{ display: "inline-block", marginRight: 8 }} /> Loading users...</p></div>
        ) : (
          <>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={6}>
                      <div className="empty-state"><p>No users found 😕</p></div>
                    </td></tr>
                  ) : users.map((u, i) => (
                    <tr key={u._id || i}>
                      <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>{(currentPage - 1) * 10 + i + 1}</td>
                      <td>
                        <div className="user-cell">
                          <div className="u-avatar">
                            {u.profileImage ? (
                              <img src={getImageUrl(u.profileImage)} alt={u.name} />
                            ) : (
                              u.name ? u.name[0].toUpperCase() : "U"
                            )}
                          </div>
                          <span className="u-name">{u.name || "Unknown"}</span>
                        </div>
                      </td>
                      <td style={{ color: "var(--text-soft)" }}>{u.email}</td>
                      <td style={{ color: "var(--text-muted)" }}>{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                      <td>
                        <span className={`badge ${u.isBlocked ? "badge-blocked" : "badge-active"}`}>
                          {u.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td>
                        <div className="tbl-actions">
                          <button className="icon-btn view" onClick={() => setSelected(u)} title="View"><Eye size={16} /></button>
                          <button 
                            className="icon-btn" 
                            style={{ 
                              color: u.isBlocked ? "var(--green)" : "var(--red-danger)",
                              background: "rgba(255, 255, 255, 0.03)"
                            }} 
                            onClick={() => handleToggleBlock(u._id, u.isBlocked)} 
                            title={u.isBlocked ? "Unblock User" : "Block User"}
                          >
                            {u.isBlocked ? <CheckCircle size={16} /> : <UserX size={16} />}
                          </button>
                          <button className="icon-btn del" onClick={() => handleDelete(u._id)} title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            {pagination.totalPages > 1 && (
              <div className="notif-pagination" style={{ marginTop: 20 }}>
                <button
                  className="notif-pg-btn"
                  disabled={!pagination.hasPrevPage || loading}
                  onClick={() => fetchUsers(currentPage - 1, search)}
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
                          onClick={() => fetchUsers(p, search)}
                          disabled={loading}
                        >
                          {p}
                        </button>
                      )
                    )
                  }
                </div>

                <button
                  className="notif-pg-btn"
                  disabled={!pagination.hasNextPage || loading}
                  onClick={() => fetchUsers(currentPage + 1, search)}
                >
                  Next →
                </button>
              </div>
            )}

            {pagination.totalCount > 0 && (
              <div className="notif-pg-info" style={{ marginTop: 10 }}>
                Showing {((pagination.currentPage - 1) * 10) + 1}–{Math.min(pagination.currentPage * 10, pagination.totalCount)} of {pagination.totalCount} users
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box modal-box-view" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3><User size={20} style={{ display: "inline-block", marginRight: 8 }} /> User Profile</h3>
              <button className="modal-close" onClick={() => setSelected(null)}><X size={24} /></button>
            </div>
            
            <div className="modal-body p-0">
              {/* Profile Hero */}
              <div className="profile-hero">
                <div className="profile-hero-bg" />
                <div className="profile-hero-content">
                  <div className="u-avatar large">
                    {selected.profileImage ? (
                      <img src={getImageUrl(selected.profileImage)} alt={selected.name} />
                    ) : (
                      selected.name?.[0]?.toUpperCase() || "U"
                    )}
                  </div>
                  <div className="profile-hero-text">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <h2 style={{ margin: 0 }}>{selected.name || "Unknown User"}</h2>
                      {selected.profileComplete && (
                        <span className="badge badge-active" style={{ fontSize: "0.65rem", padding: "2px 8px" }}>✓ VERIFIED</span>
                      )}
                    </div>
                    <p>{selected.email}</p>
                    <span className={`badge ${selected.isBlocked ? "badge-blocked" : "badge-active"}`}>
                      {selected.isBlocked ? "BLOCKED" : "ACTIVE ACCOUNT"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="profile-details-grid">
                <div className="p-detail-card">
                  <span className="p-detail-label">Full Name</span>
                  <span className="p-detail-value">{selected.name || "—"}</span>
                </div>
                <div className="p-detail-card">
                  <span className="p-detail-label">Phone Number</span>
                  <span className="p-detail-value mono">{selected.phone || "—"}</span>
                </div>
                <div className="p-detail-card">
                  <span className="p-detail-label">Email Address</span>
                  <span className="p-detail-value">{selected.email || "—"}</span>
                </div>
                <div className="p-detail-card">
                  <span className="p-detail-label">Profile Status</span>
                  <span className={`p-detail-value ${selected.profileComplete ? "text-success" : "text-warning"}`}>
                    {selected.profileComplete ? "Complete" : "Incomplete"}
                  </span>
                </div>
                <div className="p-detail-card">
                  <span className="p-detail-label">Account ID</span>
                  <span className="p-detail-value mono">{selected._id}</span>
                </div>
                <div className="p-detail-card">
                  <span className="p-detail-label">Member Since</span>
                  <span className="p-detail-value">
                    {selected.createdAt?.$date 
                      ? new Date(selected.createdAt.$date).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })
                      : selected.createdAt 
                        ? new Date(selected.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })
                        : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => setSelected(null)}>Close Window</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}