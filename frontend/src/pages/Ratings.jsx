import { useEffect, useState } from "react";
import { Search, Eye, Trash2, X } from "lucide-react";
import API from "../api/axios";
import "./Dashboard.css";

export default function RatingsPage() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRating, setSelectedRating] = useState(null);

  const fetchRatings = async () => {
    try {
      const res = await API.get("rating/all");
      setRatings(res.data.ratings);
    } catch (err) {
      console.error("Error fetching ratings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this rating?")) return;
    try {
      await API.delete(`rating/${id}`);
      setRatings((prev) => prev.filter((r) => r._id !== id));
      if (selectedRating && selectedRating._id === id) {
        setSelectedRating(null);
      }
    } catch (err) {
      console.error("Error deleting rating:", err);
      alert("Failed to delete rating");
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("WARNING: Are you sure you want to delete ALL user ratings? This action is permanent and cannot be undone.")) return;
    const secondaryConfirm = window.confirm("Please confirm once more: Do you really want to clear all feedback ratings?");
    if (!secondaryConfirm) return;

    try {
      await API.delete("rating/delete-all");
      setRatings([]);
      setSelectedRating(null);
      alert("All ratings deleted successfully");
    } catch (err) {
      console.error("Error deleting all ratings:", err);
      alert("Failed to delete all ratings");
    }
  };

  const filteredRatings = ratings.filter((r) => {
    const term = searchQuery.toLowerCase();
    const nameMatch = (r.user?.name || "").toLowerCase().includes(term);
    const emailMatch = (r.user?.email || "").toLowerCase().includes(term);
    const reviewMatch = (r.review || "").toLowerCase().includes(term);
    return nameMatch || emailMatch || reviewMatch;
  });

  return (
    <div className="page-section">
      {/* Header */}
      <div className="pg-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="pg-title">⭐ User Ratings</h1>
          <p className="pg-sub">All user feedback and reviews</p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Search Bar */}
          <div className="search-bar" style={{ width: "300px" }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search ratings..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Delete All Button */}
          {ratings.length > 0 && (
            <button
              className="btn btn-danger-premium"
              style={{
                height: "46px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "0 18px",
                fontWeight: "600",
                borderRadius: "var(--radius-sm)",
                border: "none",
                color: "#fff"
              }}
              onClick={handleDeleteAll}
              title="Delete All Ratings"
            >
              <Trash2 size={16} />
              Delete All
            </button>
          )}
        </div>
      </div>

      <div className="content-box">
        {loading ? (
          <p>Loading...</p>
        ) : ratings.length === 0 ? (
          <div className="empty-state">
            <p>No ratings yet</p>
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Date</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRatings.length > 0 ? (
                  filteredRatings.map((r) => (
                    <tr key={r._id}>
                      <td className="u-name">{r.user?.name || "N/A"}</td>
                      <td>{r.user?.email || "N/A"}</td>
                      <td>
                        <span className="badge badge-active">
                          ⭐ {r.rating}/5
                        </span>
                      </td>
                      <td>
                        {r.review && r.review.length > 30
                          ? r.review.substring(0, 30) + "..."
                          : r.review || "-"}
                      </td>
                      <td>
                        {new Date(r.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "6px", marginRight: "6px" }}
                          onClick={() => setSelectedRating(r)}
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: "6px" }}
                          onClick={() => handleDelete(r._id)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                      No ratings match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Modal */}
      {selectedRating && (
        <div className="modal-overlay" onClick={() => setSelectedRating(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="modal-head">
              <h3>Rating Details</h3>
              <button className="modal-close" onClick={() => setSelectedRating(null)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body" style={{ gap: "20px" }}>
              {/* User Identity Info */}
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "var(--primary-dim)",
                  color: "var(--primary)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "1.2rem",
                  boxShadow: "var(--shadow-sm)"
                }}>
                  {(selectedRating.user?.name || "N")[0].toUpperCase()}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "var(--text)" }}>
                    {selectedRating.user?.name || "N/A"}
                  </h4>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "500" }}>
                    {selectedRating.user?.email || "N/A"}
                  </span>
                </div>
              </div>

              {/* Rating Score & Time */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                backgroundColor: "var(--bg3)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ display: "flex", gap: "2px" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} style={{
                        color: star <= selectedRating.rating ? "var(--primary)" : "var(--border2)",
                        fontSize: "1.25rem",
                        lineHeight: 1
                      }}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text)", marginLeft: "4px" }}>
                    ({selectedRating.rating}/5)
                  </span>
                </div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: "500" }}>
                  {new Date(selectedRating.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true
                  })}
                </span>
              </div>

              {/* Written Review */}
              <div style={{
                backgroundColor: "var(--bg3)",
                padding: "16px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
              }}>
                <span style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "var(--primary)",
                  marginBottom: "8px"
                }}>
                  Review Comment
                </span>
                <p style={{
                  margin: 0,
                  lineHeight: 1.5,
                  color: "var(--text-soft)",
                  fontSize: "0.95rem",
                  fontWeight: "500",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word"
                }}>
                  {selectedRating.review || (
                    <span style={{ fontStyle: "italic", color: "var(--text-muted)" }}>
                      No written review provided.
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="modal-foot">
              <button 
                className="btn btn-glass" 
                style={{ padding: "10px 20px", borderRadius: "var(--radius-sm)", fontSize: "0.9rem" }}
                onClick={() => setSelectedRating(null)}
              >
                Close
              </button>
              <button 
                className="btn btn-danger-premium" 
                style={{ padding: "10px 20px", borderRadius: "var(--radius-sm)", fontSize: "0.9rem" }}
                onClick={() => handleDelete(selectedRating._id)}
              >
                Delete Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}