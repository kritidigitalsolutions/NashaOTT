import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import AdminLayout from "../layouts/AdminLayout";
import DashboardHome from "../pages/dashboard/DashboardHome";
import ContentLibraryPage from "../pages/dashboard/Content";
import UsersPage from "../pages/dashboard/UsersPage";
import NotificationsPage from "../pages/dashboard/NotificationsPage";
import SettingsPage from "../pages/dashboard/SettingsPage";
import AddContentPage from "../pages/dashboard/AddContentPage";
import { useAuth } from "../context/AuthContext";

/** Full-screen spinner shown while verifying JWT on first load */
function AuthLoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black-DEFAULT">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(212,175,55,0.25)] border-t-gold-neon" />
        <p className="text-xs font-semibold tracking-widest text-soft-gray">VERIFYING SESSION…</p>
      </div>
    </div>
  );
}

/**
 * Protects a route: if JWT hasn't been verified yet show spinner,
 * if not authed redirect to /login, otherwise render the page.
 */
function RequireAdminAuth({ children }) {
  const { isAuthed, loading } = useAuth();
  if (loading) return <AuthLoadingSpinner />;
  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
}

/** If admin is already logged in and hits /login, go straight to dashboard */
function RedirectIfAuthed({ children }) {
  const { isAuthed, loading } = useAuth();
  if (loading) return <AuthLoadingSpinner />;
  if (isAuthed) return <Navigate to="/dashboard" replace />;
  return children;
}

/** Wrap a page in auth check + layout */
function Protected({ children }) {
  return (
    <RequireAdminAuth>
      <AdminLayout>{children}</AdminLayout>
    </RequireAdminAuth>
  );
}

/** Stub placeholder for pages not yet built */
function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="text-4xl font-extrabold metallic">{title}</div>
      <div className="mt-3 text-sm text-soft-gray/70">This page is coming soon.</div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Login — redirects to dashboard if already authed */}
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <LoginPage />
          </RedirectIfAuthed>
        }
      />

      {/* ── Dashboard ── */}
      <Route path="/dashboard" element={<Protected><DashboardHome /></Protected>} />

      {/* ── Users ── */}
      <Route path="/dashboard/users" element={<Protected><UsersPage /></Protected>} />

      {/* ── Add Content ── */}
      <Route path="/dashboard/content/add" element={<Protected><AddContentPage /></Protected>} />

      {/* ── Content Library ── */}
      <Route path="/dashboard/content/movies" element={<Protected><ContentLibraryPage /></Protected>} />
      <Route path="/dashboard/content/tv-shows" element={<Protected><ContentLibraryPage /></Protected>} />
      <Route path="/dashboard/content" element={<Protected><ContentLibraryPage /></Protected>} />

      {/* ── Ratings ── */}
      <Route path="/dashboard/ratings" element={<Protected><ComingSoon title="Ratings" /></Protected>} />

      {/* ── Subscription Plans ── */}
      <Route path="/dashboard/subscriptions" element={<Protected><ComingSoon title="Subscription Plans" /></Protected>} />

      {/* ── Promo & Voucher ── */}
      <Route path="/dashboard/promo" element={<Protected><ComingSoon title="Promo & Voucher" /></Protected>} />

      {/* ── User Plan ── */}
      <Route path="/dashboard/user-plan" element={<Protected><ComingSoon title="User Plan" /></Protected>} />

      {/* ── Notifications ── */}
      <Route path="/dashboard/notifications" element={<Protected><NotificationsPage /></Protected>} />

      {/* ── Support ── */}
      <Route path="/dashboard/support" element={<Protected><ComingSoon title="Support" /></Protected>} />

      {/* ── Legal ── */}
      <Route path="/dashboard/legal" element={<Protected><ComingSoon title="Legal" /></Protected>} />

      {/* ── Help Center ── */}
      <Route path="/dashboard/help" element={<Protected><ComingSoon title="Help Center" /></Protected>} />

      {/* ── Settings ── */}
      <Route path="/dashboard/settings" element={<Protected><SettingsPage /></Protected>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
