import "./Sidebar.css";
import { NavLink } from "react-router-dom";
// import { BarChart3, Users, Plus, Film, FileText, HelpCircle, CreditCard, Settings, LogOut } from "lucide-react";
import { X, BarChart3, Users, Plus, Film, FileText, HelpCircle, CreditCard, Settings, LogOut, Star, Bell, MessageSquare, Clapperboard } from "lucide-react";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, color: "#d4af37" },
  { id: "users", label: "Users", icon: Users, color: "#3a86ff" },
  { id: "add-content", label: "Add Content", icon: Plus, color: "#06d6a0" },
  { id: "content", label: "Content Library", icon: Film, color: "#d4af37" },
  { id: "ratings", label: "Ratings", icon: Star, color: "#ffb703" },
  { id: "plans", label: "Subscription Plans", icon: CreditCard, color: "#8338ec" },
  { id: "promo", label: "Promo & Voucher", icon: CreditCard, color: "#ffb703" },
  { id: "pricing", label: "User Plan", icon: CreditCard, color: "#8338ec" },
  { id: "notifications", label: "Notifications", icon: Bell, color: "#ffb703" },
  { id: "support", label: "Support", icon: MessageSquare, color: "#3a86ff" },
  { id: "legal", label: "Legal Documents", icon: FileText, color: "#8338ec" },
  { id: "help", label: "Help Center", icon: HelpCircle, color: "#3a86ff" },
  { id: "settings", label: "Settings", icon: Settings, color: "#a0a0a0" },
];
export default function Sidebar({ theme, showSidebar, toggleSidebar, closeSidebar }) {
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <aside className={`sidebar ${showSidebar ? "open" : ""}`}>
      {/* ── Brand ── */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <img src="/nazar-logo.png" alt="Nazar Logo" />
        </div>
        <div>
          <div className="sidebar-title">Nazar OTT</div>
          <div className="sidebar-tag">Admin Console</div>
        </div>
        <button className="mobile-close-btn" onClick={toggleSidebar}>
          <X size={20} />
        </button>
      </div>
      {/* This is my sidebar  */}
      <div className="sidebar-divider" />

      {/* ── Nav ── */}
      <nav className="sidebar-nav">
        {NAV.map((item) => {
          const toPath = item.id === "dashboard" ? "/dashboard" : `/dashboard/${item.id}`;
          return (
            <NavLink
              key={item.id}
              to={toPath}
              end={item.id === "dashboard"}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              style={({ isActive }) => isActive ? { "--accent": item.color } : undefined}
              onClick={() => closeSidebar && closeSidebar()}
            >
              {({ isActive }) => (
                <>
                  <span className="nav-icon-wrap" style={isActive ? { background: item.color + "18", color: item.color } : undefined}>
                    <item.icon size={18} />
                  </span>
                  <span className="nav-label">{item.label}</span>
                  {isActive && <span className="nav-pill" style={{ background: item.color }} />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        <div className="sidebar-divider" />
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} /> <span>Logout</span>
        </button>
        <p className="sidebar-version">v1.0 · {theme === "dark" ? "Premium Dark" : "Premium Light"}</p>
      </div>
    </aside>
  );
}
