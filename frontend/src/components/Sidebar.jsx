import "./Sidebar.css";
import { NavLink } from "react-router-dom";
import Logo from "./Logo";
// import { BarChart3, Users, Plus, Film, FileText, HelpCircle, CreditCard, Settings, LogOut } from "lucide-react";
import { X, BarChart3, Users, Plus, Film, FileText, HelpCircle, CreditCard, Settings, LogOut, Star, Bell, MessageSquare, Clapperboard, Layers, Building2, ShieldCheck } from "lucide-react";
//new things
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, color: "#d4af37" },
  { id: "subadmins", label: "Sub-admins & Staff", icon: ShieldCheck, color: "#a855f7", requiresSuperAdmin: true },
  { id: "users", label: "Users", icon: Users, color: "#3a86ff" },
  { id: "add-content", label: "Add Content", icon: Plus, color: "#06d6a0" },
  { id: "content", label: "Content Library", icon: Film, color: "#d4af37" },
  { id: "categories", label: "Categories", icon: Layers, color: "#06d6a0" },
  { id: "ratings", label: "Ratings", icon: Star, color: "#ffb703" },
  { id: "pricing", label: "Subscribed Users", icon: CreditCard, color: "#8338ec" },
  { id: "plans", label: "Subscription Plans", icon: CreditCard, color: "#8338ec" },
  { id: "promo", label: "Promo & Voucher", icon: CreditCard, color: "#ffb703" },

  { id: "notifications", label: "Notifications", icon: Bell, color: "#ffb703" },
  { id: "support", label: "Support", icon: MessageSquare, color: "#3a86ff" },
  { id: "company-info", label: "Company Info", icon: Building2, color: "#06d6a0" },
  { id: "legal", label: "Legal Documents", icon: FileText, color: "#8338ec" },
  { id: "help", label: "Help Center", icon: HelpCircle, color: "#3a86ff" },
  { id: "settings", label: "Settings", icon: Settings, color: "#a0a0a0" },
];
export default function Sidebar({ theme, showSidebar, toggleSidebar, closeSidebar }) {
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const adminRole = localStorage.getItem("adminRole") || "ADMIN";

  return (
    <aside className={`sidebar ${showSidebar ? "open" : ""}`}>
      {/* ── Brand ── */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Logo alt="Nazar Logo" />
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
        {NAV.filter(item => {
          if (item.requiresSuperAdmin && adminRole !== "ADMIN") return false;
          if (adminRole === "ADMIN") return true;

          const adminPermissions = (() => {
            try { return JSON.parse(localStorage.getItem("adminPermissions") || "[]"); }
            catch { return []; }
          })();

          const map = {
            "dashboard": "dashboard",
            "users": "users",
            "add-content": ["movies", "series", "content"],
            "content": ["movies", "series", "content"],
            "categories": "categories",
            "ratings": "ratings",
            "pricing": "pricing",
            "plans": "plans",
            "promo": "promo",
            "notifications": "notifications",
            "support": "support",
            "company-info": "company-info",
            "legal": "legal",
            "help": "help",
            "settings": "settings"
          };

          const requiredModules = Array.isArray(map[item.id]) ? map[item.id] : [map[item.id]];

          return requiredModules.some(mod =>
            adminPermissions.some(perm => perm === mod || perm.startsWith(`${mod}.`))
          );
        }).map((item) => {
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
