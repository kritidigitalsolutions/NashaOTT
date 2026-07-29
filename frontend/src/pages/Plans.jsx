import { useEffect, useState } from "react";
import { Eye, Pencil, Trash2, X } from "lucide-react";
import API from "../api/axios";
import "./Dashboard.css";

const initialForm = { name: "", price: "", duration: "", features: "", planType: "monthly", sortOrder: 0, isRecommended: false, isActive: true };

const ToggleSwitch = ({ checked, onChange }) => (
  <div 
    onClick={onChange}
    style={{
      width: "42px",
      height: "22px",
      borderRadius: "11px",
      background: checked ? "rgba(6, 214, 160, 0.15)" : "rgba(160, 160, 160, 0.1)",
      border: checked ? "1px solid rgba(6, 214, 160, 0.3)" : "1px solid rgba(160, 160, 160, 0.2)",
      position: "relative",
      cursor: "pointer",
      transition: "all 0.25s ease",
      display: "inline-block"
    }}
  >
    <div 
      style={{
        width: "14px",
        height: "14px",
        borderRadius: "50%",
        background: checked ? "var(--green)" : "#707070",
        position: "absolute",
        top: "3px",
        left: checked ? "23px" : "3px",
        transition: "all 0.25s ease"
      }}
    />
  </div>
);

export default function PlansPage() {
  const [form, setForm] = useState(initialForm);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewPlan, setViewPlan] = useState(null);

  const fetchPlans = async () => {
    try { const res = await API.get("/admin/plan"); setPlans(res.data.plans); } catch (err) { console.error(err); }
  };
  useEffect(() => { fetchPlans(); }, []);

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.type === "checkbox" ? event.target.checked : event.target.value });
  const submit = async (event) => {
    event.preventDefault(); setLoading(true);
    const payload = { ...form, price: Number(form.price), duration: Number(form.duration), sortOrder: Number(form.sortOrder), features: form.features.split(",").map((item) => item.trim()).filter(Boolean) };
    try {
      if (editId) await API.patch(`/admin/plan/${editId}`, payload); else await API.post("/admin/plan", payload);
      setForm(initialForm); setEditId(null); fetchPlans();
    } catch (err) { console.error(err); alert("An error occurred. Please try again."); }
    setLoading(false);
  };
  const edit = (plan) => { setForm({ ...plan, features: (plan.features || []).join(", "), planType: plan.planType || "monthly", sortOrder: plan.sortOrder || 0, isRecommended: plan.isRecommended || false, isActive: plan.isActive !== false }); setEditId(plan._id); };
  const remove = async (id) => { if (!window.confirm("Delete this plan?")) return; try { await API.delete(`/admin/plan/${id}`); fetchPlans(); } catch (err) { console.error(err); } };

  const toggleActive = async (plan) => {
    const updatedActive = plan.isActive === false ? true : false;
    
    // 1. Optimistically update local UI state instantly
    setPlans(prevPlans => 
      prevPlans.map(p => p._id === plan._id ? { ...p, isActive: updatedActive } : p)
    );

    try {
      // 2. Perform the server update in the background
      await API.patch(`/admin/plan/${plan._id}`, { isActive: updatedActive });
      
      // Keep UI in sync with the database
      fetchPlans();
    } catch (err) {
      console.error(err);
      alert("Failed to toggle status.");
      
      // 3. Revert back to original state if request fails
      setPlans(prevPlans => 
        prevPlans.map(p => p._id === plan._id ? { ...p, isActive: plan.isActive } : p)
      );
    }
  };
  return (
    <div className="add-content-page">
      <div className="pg-header">
        <h1 className="pg-title">💳 Subscription Plans</h1>
        <p className="pg-sub">Create and manage plans</p>
      </div>

      <form onSubmit={submit}>
        <div className="form-card">
          <h3>{editId ? "Edit Plan" : "Create New Plan"}</h3>
          
          <div className="form-2col">
            {/* Plan Name */}
            <div className="form-row">
              <label className="form-label">Plan Name</label>
              <input
                className="form-input-styled"
                name="name"
                placeholder="e.g. Basic or Premium"
                value={form.name}
                onChange={change}
                required
              />
            </div>

            {/* Price (₹) */}
            <div className="form-row">
              <label className="form-label">Price (₹)</label>
              <input
                className="form-input-styled"
                name="price"
                type="number"
                placeholder="e.g. 99"
                value={form.price}
                onChange={change}
                required
              />
            </div>

            {/* Duration (days) */}
            <div className="form-row">
              <label className="form-label">Duration (days)</label>
              <input
                className="form-input-styled"
                name="duration"
                type="number"
                placeholder="e.g. 30"
                value={form.duration}
                onChange={change}
                required
              />
            </div>

            {/* Spacer */}
            <div></div>

            {/* Plan Features */}
            <div className="form-row form-full">
              <label className="form-label">Plan Features</label>
              <input
                className="form-input-styled"
                name="features"
                placeholder="e.g. Ad-free streaming, HD quality, Offline downloads"
                value={form.features}
                onChange={change}
              />
              <small style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: 4 }}>
                Separate each feature with a comma.
              </small>
            </div>

            {/* Commented out the Plan Type dropdown as requested */}
            {/*
            <div className="form-row">
              <label className="form-label">Plan Type</label>
              <select className="form-input-styled" name="planType" value={form.planType} onChange={change}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="lifetime">Lifetime</option>
              </select>
            </div>
            */}

            {/* Display Order */}
            <div className="form-row">
              <label className="form-label">Display Order</label>
              <input
                className="form-input-styled"
                name="sortOrder"
                type="number"
                placeholder="e.g. 1"
                value={form.sortOrder}
                onChange={change}
              />
              <small style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: 4 }}>
                Lower numbers appear first.
              </small>
            </div>

            {/* Recommended Plan Checkbox */}
            <div style={{ display: "flex", alignItems: "center", marginTop: 24 }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 600 }}>
                <input
                  type="checkbox"
                  name="isRecommended"
                  checked={form.isRecommended}
                  onChange={change}
                  style={{ width: "16px", height: "16px", accentColor: "var(--primary)", cursor: "pointer" }}
                />
                Recommended Plan
              </label>
            </div>

            {/* Active Checkbox */}
            <div className="form-full" style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 600 }}>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={change}
                  style={{ width: "16px", height: "16px", accentColor: "var(--primary)", cursor: "pointer" }}
                />
                Active (Visible to users)
              </label>
            </div>
          </div>

          <button className="btn-lg" type="submit" style={{ marginTop: 20 }} disabled={loading}>
            {loading ? "Processing..." : editId ? "Update Plan" : "Create Plan"}
          </button>
        </div>
      </form>

      {/* Plans List Table */}
      <div className="content-box" style={{ marginTop: 24 }}>
        <h3>All Plans</h3>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Type</th>
                <th>Status</th>
                <th>Recommended</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr>
                  <td colSpan="7">No plans found</td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan._id}>
                    <td>{plan.name}</td>
                    <td>₹{plan.price}</td>
                    <td>{plan.duration} days</td>
                    <td>{plan.planType || "Monthly"}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <ToggleSwitch 
                          checked={plan.isActive !== false} 
                          onChange={() => toggleActive(plan)} 
                        />
                        <span style={{ fontSize: "0.85rem", color: plan.isActive !== false ? "var(--green)" : "var(--text-muted)" }}>
                          {plan.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td>{plan.isRecommended ? "Yes" : "No"}</td>
                    <td className="actions">
                      <button className="icon-btn" type="button" onClick={() => setViewPlan(plan)}>
                        <Eye size={16} />
                      </button>
                      <button className="icon-btn edit" type="button" onClick={() => edit(plan)}>
                        <Pencil size={16} />
                      </button>
                      <button className="icon-btn delete" type="button" onClick={() => remove(plan._id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Details Modal */}
      {viewPlan && (
        <div className="modal-overlay" onClick={() => setViewPlan(null)}>
          <div className="modal-box" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>Plan Details</h3>
              <button className="modal-close" type="button" onClick={() => setViewPlan(null)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <p><strong>Name:</strong> {viewPlan.name}</p>
              <p><strong>Price:</strong> ₹{viewPlan.price}</p>
              <p><strong>Duration:</strong> {viewPlan.duration} days</p>
              <p><strong>Type:</strong> {viewPlan.planType || "Monthly"}</p>
              <p><strong>Status:</strong> {viewPlan.isActive !== false ? "Active" : "Inactive"}</p>
              <p><strong>Recommended:</strong> {viewPlan.isRecommended ? "Yes" : "No"}</p>
              <p><strong>Features:</strong> {(viewPlan.features || []).join(", ") || "No features added"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
