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
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h2>Rating Details</h2>
              <button className="btn-close" onClick={() => setSelectedRating(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                  {(selectedRating.user?.name || "N")[0].toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>{selectedRating.user?.name || "N/A"}</h3>
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    {selectedRating.user?.email || "N/A"}
                  </p>
                </div>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="badge badge-active" style={{ fontSize: "1rem", padding: "8px 12px" }}>
                  ⭐ {selectedRating.rating}/5
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  {new Date(selectedRating.createdAt).toLocaleString("en-IN")}
                </span>
              </div>
              
              <div style={{ backgroundColor: "var(--bg-lighter)", padding: "15px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", color: "var(--text-muted)" }}>Review</h4>
                <p style={{ margin: 0, lineHeight: 1.5 }}>
                  {selectedRating.review || <span style={{ fontStyle: "italic", color: "var(--text-muted)" }}>No written review provided.</span>}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedRating(null)}>Close</button>
              <button className="btn btn-danger" onClick={() => handleDelete(selectedRating._id)}>Delete Rating</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}