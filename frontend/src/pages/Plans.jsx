import { useEffect, useState } from "react";
import { Eye, Pencil, Trash2, X } from "lucide-react";
import API from "../api/axios";
import "./Dashboard.css";

const initialForm = { name: "", price: "", duration: "", features: "", planType: "monthly", sortOrder: 0, isRecommended: false, isActive: true };

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

  return <div className="add-content-page"><div className="pg-header"><h1 className="pg-title">Subscription Plans</h1><p className="pg-sub">Create and manage plans</p></div><form onSubmit={submit}><div className="form-card"><h3>{editId ? "Edit Plan" : "Create New Plan"}</h3><div className="form-2col">
    <input className="form-input-styled" name="name" placeholder="Plan Name (Basic, Premium)" value={form.name} onChange={change} required />
    <input className="form-input-styled" name="price" type="number" placeholder="Price (₹)" value={form.price} onChange={change} required />
    <input className="form-input-styled" name="duration" type="number" placeholder="Duration (days)" value={form.duration} onChange={change} required />
    <input className="form-input-styled form-full" name="features" placeholder="Features (comma separated)" value={form.features} onChange={change} />
    <select className="form-input-styled" name="planType" value={form.planType} onChange={change}><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option><option value="lifetime">Lifetime</option></select>
    <input className="form-input-styled" name="sortOrder" type="number" placeholder="Sort Order (e.g. 1)" value={form.sortOrder} onChange={change} />
    <label><input type="checkbox" name="isRecommended" checked={form.isRecommended} onChange={change} /> Recommended Plan</label>
    <label><input type="checkbox" name="isActive" checked={form.isActive} onChange={change} /> Active (Visible to users)</label>
  </div><button className="btn-lg" type="submit" style={{ marginTop: 16 }} disabled={loading}>{loading ? "Processing..." : editId ? "Update Plan" : "Create Plan"}</button></div></form>
    <div className="content-box" style={{ marginTop: 24 }}><h3>All Plans</h3><div className="tbl-wrap"><table className="tbl"><thead><tr><th>Name</th><th>Price</th><th>Duration</th><th>Type</th><th>Status</th><th>Recommended</th><th>Actions</th></tr></thead><tbody>{plans.length === 0 ? <tr><td colSpan="7">No plans found</td></tr> : plans.map((plan) => <tr key={plan._id}><td>{plan.name}</td><td>₹{plan.price}</td><td>{plan.duration} days</td><td>{plan.planType || "Monthly"}</td><td>{plan.isActive !== false ? "Active" : "Inactive"}</td><td>{plan.isRecommended ? "Yes" : "No"}</td><td className="actions"><button className="icon-btn" type="button" onClick={() => setViewPlan(plan)}><Eye size={16} /></button><button className="icon-btn edit" type="button" onClick={() => edit(plan)}><Pencil size={16} /></button><button className="icon-btn delete" type="button" onClick={() => remove(plan._id)}><Trash2 size={16} /></button></td></tr>)}</tbody></table></div></div>
    {viewPlan && <div className="modal-overlay" onClick={() => setViewPlan(null)}><div className="modal-box" onClick={(event) => event.stopPropagation()}><div className="modal-head"><h3>Plan Details</h3><button className="modal-close" type="button" onClick={() => setViewPlan(null)}><X size={24} /></button></div><p><strong>{viewPlan.name}</strong> — ₹{viewPlan.price} for {viewPlan.duration} days</p><p>{(viewPlan.features || []).join(", ") || "No features added"}</p></div></div>}
  </div>;
}
