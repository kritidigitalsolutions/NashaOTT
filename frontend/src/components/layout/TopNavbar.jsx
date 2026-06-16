import React, { useContext, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../../context/ThemeContext";
import { FiBell, FiSearch, FiSun, FiMoon, FiChevronDown } from "react-icons/fi";
import { IoPersonCircleOutline } from "react-icons/io5";

export default function TopNavbar({ onLogout, onOpenMobileSidebar }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState("");

  const isDark = theme === "dark";
  const themeIcon = isDark ? <FiSun /> : <FiMoon />;

  /* ── Theme-aware colour tokens ── */
  // Header: dark glass in dark mode, white/cream frosted in light mode
  const headerBg    = isDark ? "rgba(10,10,10,0.72)"    : "rgba(255,252,240,0.88)";
  const searchBg    = isDark ? "rgba(0,0,0,0.20)"       : "rgba(255,255,255,0.70)";
  const btnBg       = isDark ? "rgba(0,0,0,0.20)"       : "rgba(255,255,255,0.70)";
  const dropdownBg  = isDark ? "rgba(10,10,10,0.88)"    : "rgba(255,252,240,0.96)";
  const textColor   = isDark ? "rgba(255,255,255,0.80)" : "rgba(17,17,17,0.85)";
  const subText     = isDark ? "rgba(255,255,255,0.60)" : "rgba(17,17,17,0.55)";
  const borderColor = isDark ? "rgba(212,175,55,0.14)"  : "rgba(184,134,11,0.28)";

  const dropdownVariants = useMemo(
    () => ({
      hidden:  { opacity: 0, y: -6, scale: 0.98 },
      visible: { opacity: 1, y:  0, scale: 1    },
    }),
    []
  );

  const onSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate("/dashboard", { replace: false });
  };

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-luxury"
      style={{
        backgroundColor: headerBg,
        borderBottom: `1px solid ${borderColor}`,
      }}
    >
      <div className="flex items-center gap-3 px-0 py-3.5 md:gap-4">

        {/* Mobile menu button */}
        <div className="flex items-center lg:hidden">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="ml-3 rounded-xl px-3 py-2 text-sm font-medium"
            style={{ color: textColor, background: btnBg, border: `1px solid ${borderColor}` }}
          >
            Menu
          </button>
        </div>

        {/* Search bar */}
        <div className="flex-1">
          <form
            onSubmit={onSearch}
            className="mx-3 flex items-center gap-2 rounded-2xl px-4 py-2"
            style={{ background: searchBg, border: `1px solid ${borderColor}` }}
          >
            <FiSearch style={{ color: "rgba(212,175,55,0.80)", flexShrink: 0 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies, users, revenue..."
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: textColor }}
              aria-label="Search"
            />
          </form>
        </div>

        {/* Right controls */}
        <div className="mr-3 flex items-center gap-2">

          {/* Notifications */}
          <button
            type="button"
            className="relative rounded-xl p-2"
            style={{ color: textColor, background: btnBg, border: `1px solid ${borderColor}` }}
            aria-label="Notifications"
            onClick={() => navigate("/dashboard/notifications")}
          >
            <FiBell style={{ color: "rgba(212,175,55,0.85)" }} />
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-gold-neon shadow-goldGlow" />
          </button>

          {/* Theme toggle */}
          <button
            type="button"
            className="rounded-xl p-2"
            style={{ color: textColor, background: btnBg, border: `1px solid ${borderColor}` }}
            aria-label="Toggle theme"
            onClick={toggleTheme}
          >
            {themeIcon}
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium"
              style={{ color: textColor, background: btnBg, border: `1px solid ${borderColor}` }}
              onClick={() => setProfileOpen((v) => !v)}
              aria-label="Admin profile menu"
            >
              <IoPersonCircleOutline style={{ color: "rgba(212,175,55,0.85)" }} size={20} />
              <span className="hidden sm:inline">Admin</span>
              <FiChevronDown style={{ color: subText }} />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={dropdownVariants}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl shadow-premium backdrop-blur-luxury"
                  style={{
                    backgroundColor: dropdownBg,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <div className="px-4 py-3">
                    <div className="text-xs font-semibold tracking-widest text-soft-gray">
                      ENTERPRISE ADMIN
                    </div>
                    <div className="mt-1 text-sm" style={{ color: textColor }}>
                      admin@nashaott.com
                    </div>
                  </div>

                  <div style={{ borderTop: `1px solid ${borderColor}` }}>
                    <button
                      type="button"
                      className="w-full px-4 py-3 text-left text-sm hover:bg-[rgba(212,175,55,0.08)] transition-colors"
                      style={{ color: textColor }}
                      onClick={() => { setProfileOpen(false); navigate("/dashboard/settings"); }}
                    >
                      Settings
                    </button>

                    <button
                      type="button"
                      className="w-full px-4 py-3 text-left text-sm hover:bg-[rgba(212,175,55,0.08)] transition-colors"
                      style={{ color: textColor }}
                      onClick={() => { setProfileOpen(false); onLogout?.(); }}
                    >
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
