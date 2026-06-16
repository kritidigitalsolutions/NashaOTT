import React from "react";
import { useNavigate } from "react-router-dom";
import nashaLogo from "../../assets/nasha-logo.png";
import {
  FiBarChart2,
  FiUsers,
  FiPlus,
  FiFilm,
  FiStar,
  FiCreditCard,
  FiTag,
  FiUser,
  FiBell,
  FiMessageSquare,
  FiFileText,
  FiHelpCircle,
  FiSettings,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

const menu = [
  { label: "Dashboard",          path: "/dashboard",                  icon: FiBarChart2 },
  { label: "Users",              path: "/dashboard/users",             icon: FiUsers },
  { label: "Add Content",        path: "/dashboard/content/add",       icon: FiPlus },
  { label: "Content Library",    path: "/dashboard/content/movies",    icon: FiFilm },
  { label: "Ratings",            path: "/dashboard/ratings",           icon: FiStar },
  { label: "Subscription Plans", path: "/dashboard/subscriptions",     icon: FiCreditCard },
  { label: "Promo&Voucher",      path: "/dashboard/promo",             icon: FiTag },
  { label: "User Plan",          path: "/dashboard/user-plan",         icon: FiUser },
  { label: "Notifications",      path: "/dashboard/notifications",     icon: FiBell },
  { label: "Support",            path: "/dashboard/support",           icon: FiMessageSquare },
  { label: "Legal",              path: "/dashboard/legal",             icon: FiFileText },
  { label: "Help Center",        path: "/dashboard/help",              icon: FiHelpCircle },
  { label: "Settings",           path: "/dashboard/settings",          icon: FiSettings },
];

export default function Sidebar({ sidebarOpen, onToggle, activePath, mobile, onLogout }) {
  const navigate = useNavigate();
  const show = sidebarOpen;

  const isActive = (path) => {
    if (path === "/dashboard") return activePath === "/dashboard";
    return activePath.startsWith(path);
  };

  return (
    <aside className="h-full w-full shrink-0 flex flex-col">
      <div className="flex h-full min-h-0 flex-col border-r border-[rgba(212,175,55,0.10)] bg-transparent">

        {/* Brand header */}
        <div className="flex items-center justify-between px-3 py-4 shrink-0">
          <div className="flex items-center gap-2">
            {/* Real Nasha OTT logo */}
            <img
              src={nashaLogo}
              alt="Nasha OTT"
              className="h-10 w-10 rounded-xl object-cover shrink-0"
            />
            <div className={["min-w-0 transition-opacity", show ? "opacity-100" : "opacity-0 w-0 overflow-hidden"].join(" ")}>
              <div className="text-xs font-extrabold tracking-widest text-white">NASHA</div>
              <div className="text-[10px] font-semibold tracking-wide text-soft-gray/70">ADMIN PANEL</div>
            </div>
          </div>

          {!mobile && (
            <button
              type="button"
              onClick={onToggle}
              className="rounded-lg p-2 text-white/60 hover:text-white focus:outline-none"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <FiChevronLeft size={15} /> : <FiChevronRight size={15} />}
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => { e.preventDefault(); navigate(item.path); }}
                className={[
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-[rgba(212,175,55,0.13)] text-white border border-[rgba(212,175,55,0.22)]"
                    : "text-white/70 hover:text-white hover:bg-[rgba(212,175,55,0.06)] border border-transparent",
                ].join(" ")}
              >
                <span className={[
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                  active ? "text-gold-neon" : "text-white/60",
                ].join(" ")}>
                  <Icon size={16} />
                </span>

                <span className={["truncate transition-opacity", show ? "opacity-100" : "opacity-0 w-0 overflow-hidden"].join(" ")}>
                  {item.label}
                </span>

                {active && show && (
                  <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-gold-neon" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-[rgba(212,175,55,0.10)] px-3 py-4 space-y-2">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 hover:text-white hover:bg-[rgba(212,175,55,0.06)] transition-colors border border-transparent"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/60">
              <FiLogOut size={16} />
            </span>
            <span className={["truncate transition-opacity", show ? "opacity-100" : "opacity-0"].join(" ")}>
              Logout
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
