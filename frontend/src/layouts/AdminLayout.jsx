import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import TopNavbar from "../components/layout/TopNavbar";
import { FiLogOut } from "react-icons/fi";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const brandPath = useMemo(() => {
    const p = location.pathname || "/";
    if (p.startsWith("/dashboard")) return p;
    return "/dashboard";
  }, [location.pathname]);

  const onLogout = () => {
    localStorage.removeItem("nasha_admin_authed");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <motion.div
          className="hidden lg:flex h-screen overflow-hidden sticky top-0"
          initial={false}
          animate={{ width: sidebarOpen ? 260 : 76 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
        >
          <Sidebar
            sidebarOpen={sidebarOpen}
            onToggle={() => setSidebarOpen((v) => !v)}
            activePath={brandPath}
            onLogout={onLogout}
          />
        </motion.div>

        {/* Mobile sidebar */}
        <div className="lg:hidden">
          <Sidebar
            sidebarOpen={true}
            onToggle={() => {}}
            activePath={brandPath}
            mobile
            onLogout={onLogout}
          />
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNavbar
            onLogout={onLogout}
            onOpenMobileSidebar={() => {}}
          />

          <main className="flex-1 px-4 py-6 md:px-7 lg:px-10">
            <div className="mx-auto w-full max-w-7xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          <footer className="border-t border-[rgba(212,175,55,0.10)] bg-transparent px-4 py-5 text-center text-xs text-soft-gray/80 md:px-7 lg:px-10">
            <span className="metallic">NASHA OTT</span> Admin Dashboard • Luxury Enterprise UI
          </footer>
        </div>
      </div>

      {/* Floating logout (kept subtle) */}
      <button
        onClick={onLogout}
        className="fixed bottom-5 right-5 z-[60] hidden rounded-full border border-[rgba(212,175,55,0.18)] bg-black-DEFAULT/30 p-3 text-white/80 shadow-premium backdrop-blur-luxury hover:text-white"
        aria-label="Logout"
      >
        <FiLogOut />
      </button>
    </div>
  );
}
