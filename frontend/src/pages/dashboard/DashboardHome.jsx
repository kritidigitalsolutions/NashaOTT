import React, { useContext, useMemo, useState } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import {
  FiUsers,
  FiFilm,
  FiActivity,
  FiSun,
  FiCalendar,
  FiUserPlus,
  FiUserCheck,
  FiUserX,
  FiClock,
  FiDollarSign,
  FiDatabase,
  FiRefreshCw,
  FiBarChart2,
  FiLayers,
} from "react-icons/fi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

/* ─── Small helpers ──────────────────────────────────────────── */

function today() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** A single stat card matching the Mirchi layout */
function StatCard({ title, value, subtitle, subtitleColor, icon: Icon, prefix = "", accentColor, isDark }) {
  const _accent   = accentColor  || (isDark ? "rgba(212,175,55,0.70)" : "rgba(122,92,0,0.80)");
  const _subtitle = subtitleColor || (isDark ? "rgba(255,255,255,0.50)" : "rgba(90,65,0,0.85)");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-2xl border border-[rgba(212,175,55,0.14)] glass p-5"
      style={{ borderLeft: `3px solid ${_accent}` }}
    >
      {/* Icon */}
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(212,175,55,0.14)] bg-black-DEFAULT/20">
        <Icon className="text-soft-gray" size={18} />
      </div>

      <div className="text-[11px] font-semibold uppercase tracking-widest text-soft-gray">
        {title}
      </div>
      <div className="mt-1.5 text-3xl font-extrabold text-white">
        {prefix}
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="mt-1 text-xs" style={{ color: _subtitle }}>
        {subtitle}
      </div>
    </motion.div>
  );
}

/* ─── Stub data ──────────────────────────────────────────────── */

const recentUsers = [
  { id: 1, name: "Tester",  email: "tester@example.com",  joined: "5/6/2026" },
  { id: 2, name: "Tushar",  email: "tushar@example.com",  joined: "4/6/2026" },
  { id: 3, name: "Don",     email: "don@example.com",     joined: "4/6/2026" },
  { id: 4, name: "Garima",  email: "garima@example.com",  joined: "4/6/2026" },
  { id: 5, name: "Milind",  email: "milind@example.com",  joined: "2/6/2026" },
];

/* ─── Main component ─────────────────────────────────────────── */

export default function DashboardHome() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const tickColor = isDark ? "rgba(255,255,255,0.55)" : "rgba(17,17,17,0.60)";
  const legendColor = isDark ? "rgba(255,255,255,0.65)" : "rgba(17,17,17,0.65)";
  const tooltipTitle = isDark ? "#fff" : "#111";
  const tooltipBody  = isDark ? "rgba(255,255,255,0.85)" : "rgba(17,17,17,0.85)";
  const tooltipBg    = isDark ? "rgba(0,0,0,0.85)" : "rgba(255,252,240,0.96)";

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  /* Chart data */
  const userGrowthData = useMemo(
    () => ({
      labels: ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon"],
      datasets: [
        {
          label: "New Users",
          data: [1, 3, 2, 4, 2, 3, 5],
          borderColor: "rgba(212,175,55,0.9)",
          backgroundColor: "rgba(212,175,55,0.08)",
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    }),
    []
  );

  const contentSplitData = useMemo(
    () => ({
      labels: ["Movies", "TV Shows", "Web Series", "Short Films"],
      datasets: [
        {
          data: [45, 28, 18, 9],
          backgroundColor: [
            "rgba(255,215,0,0.90)",
            "rgba(247,215,116,0.70)",
            "rgba(212,175,55,0.50)",
            "rgba(255,255,255,0.18)",
          ],
          borderWidth: 0,
        },
      ],
    }),
    []
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tooltipBg,
          borderColor: "rgba(212,175,55,0.35)",
          borderWidth: 1,
          titleColor: tooltipTitle,
          bodyColor: tooltipBody,
        },
      },
      scales: {
        x: {
          ticks: { color: tickColor, font: { size: 11 } },
          grid: { color: "rgba(212,175,55,0.08)" },
        },
        y: {
          ticks: { color: tickColor, font: { size: 11 } },
          grid: { color: "rgba(212,175,55,0.08)" },
        },
      },
    }),
    [tickColor, tooltipBg, tooltipTitle, tooltipBody]
  );

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: 58,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: legendColor, padding: 12, font: { size: 11 } },
        },
        tooltip: {
          backgroundColor: tooltipBg,
          borderColor: "rgba(212,175,55,0.35)",
          borderWidth: 1,
          titleColor: tooltipTitle,
          bodyColor: tooltipBody,
        },
      },
    }),
    [legendColor, tooltipBg, tooltipTitle, tooltipBody]
  );

  /* Gold accent variants — darker in light mode for readability */
  const G  = isDark ? "rgba(212,175,55,0.80)" : "rgba(122,92,0,0.90)";
  const GS = isDark ? "rgba(247,215,116,0.70)" : "rgba(139,98,0,0.80)";
  const GN = isDark ? "rgba(255,215,0,0.80)"  : "rgba(107,74,0,0.90)";

  return (
    <div className="space-y-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">
            Welcome back, <span className="metallic">Admin</span> 🔥
          </h1>
          <p className="mt-0.5 text-xs text-soft-gray">{today()}</p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="flex items-center gap-2 rounded-xl border border-[rgba(212,175,55,0.18)] bg-black-DEFAULT/15 glass px-4 py-2 text-xs font-semibold text-soft-gray hover:text-white transition-colors"
        >
          <FiRefreshCw className={refreshing ? "animate-spin text-gold-neon" : "text-gold-neon"} size={13} />
          Refresh
        </button>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 1 — Platform Overview
      ══════════════════════════════════════════ */}
      <section>
        <div className="mb-1 flex items-center gap-2 border-b border-[rgba(212,175,55,0.10)] pb-3">
          <FiBarChart2 className="text-gold-neon" size={18} />
          <h2 className="text-base font-bold text-white">Platform Overview</h2>
          <span className="ml-1 text-xs text-soft-gray/70">Real-time stats and analytics for Nasha</span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard title="Total Users"      value={12840} subtitle="↑ +12% this week"             subtitleColor="rgba(212,175,55,0.85)"  icon={FiUsers}    accentColor={G} />
          <StatCard title="Content Library"  value={512}   subtitle="↑ +8% this week"              subtitleColor="rgba(247,215,116,0.85)" icon={FiFilm}     accentColor={GS} />
          <StatCard title="Active Users"     value={8420}  subtitle="↑ Live now"                   subtitleColor="rgba(255,215,0,0.85)"   icon={FiActivity} accentColor={GN} />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 2 — Registration
      ══════════════════════════════════════════ */}
      <section>
        <div className="mb-1 flex items-center gap-2 border-b border-[rgba(212,175,55,0.10)] pb-3">
          <FiUserPlus className="text-gold-neon" size={18} />
          <h2 className="text-base font-bold text-white">Registration</h2>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard title="Today Registration"        value={0}  subtitle="New users today"       subtitleColor="rgba(212,175,55,0.85)"  icon={FiSun}      accentColor={G} />
          <StatCard title="Yesterday Registration"    value={0}  subtitle="New users yesterday"   subtitleColor="rgba(247,215,116,0.85)" icon={FiCalendar} accentColor={GS} />
          <StatCard title="Total Registration Counts" value={12840} subtitle="All registered users" subtitleColor="rgba(255,215,0,0.85)" icon={FiUsers}    accentColor={GN} />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 3 — Subscriptions
      ══════════════════════════════════════════ */}
      <section>
        <div className="mb-1 flex items-center gap-2 border-b border-[rgba(212,175,55,0.10)] pb-3">
          <FiUserCheck className="text-gold-neon" size={18} />
          <h2 className="text-base font-bold text-white">Subscriptions</h2>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard title="Total Subscribe Users"     value={6240}  subtitle="Active subscription users" subtitleColor="rgba(212,175,55,0.85)"  icon={FiUserCheck} accentColor={G} />
          <StatCard title="Total Not Subscribe Users" value={6600}  subtitle="No active subscription"   subtitleColor="rgba(247,215,116,0.85)" icon={FiUserX}     accentColor={GS} />
          <StatCard title="Expiry Subscription Counts" value={184}  subtitle="Expired subscriptions"    subtitleColor="rgba(255,215,0,0.70)"   icon={FiClock}     accentColor={GN} />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 4 — Income
      ══════════════════════════════════════════ */}
      <section>
        <div className="mb-1 flex items-center gap-2 border-b border-[rgba(212,175,55,0.10)] pb-3">
          <FiDollarSign className="text-gold-neon" size={18} />
          <h2 className="text-base font-bold text-white">Income</h2>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          <StatCard title="Today Income"     value={0}       prefix="₹" subtitle="Current day earnings"  subtitleColor="rgba(212,175,55,0.85)"  icon={FiSun}        accentColor={G} />
          <StatCard title="Yesterday Income" value={0}       prefix="₹" subtitle="Previous day earnings" subtitleColor="rgba(247,215,116,0.85)" icon={FiCalendar}   accentColor={GS} />
          <StatCard title="Weekly Income"    value={0}       prefix="₹" subtitle="This week earnings"    subtitleColor="rgba(255,215,0,0.85)"   icon={FiCalendar}   accentColor={GN} />
          <StatCard title="Monthly Income"   value={0}       prefix="₹" subtitle="This month earnings"   subtitleColor="rgba(212,175,55,0.85)"  icon={FiCalendar}   accentColor={G} />
          <StatCard title="Yearly Income"    value={2489000} prefix="₹" subtitle="This year earnings"    subtitleColor="rgba(247,215,116,0.85)" icon={FiCalendar}   accentColor={GS} />
        </div>

        {/* Total income counts – standalone card */}
        <div className="mt-4 max-w-xs">
          <StatCard title="Total Income Counts" value={2489000} prefix="₹" subtitle="Overall revenue" subtitleColor="rgba(212,175,55,0.85)" icon={FiDatabase} accentColor={GN} />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 5 — Charts
      ══════════════════════════════════════════ */}
      <section>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">

          {/* User Growth line chart */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="xl:col-span-2 rounded-2xl border border-[rgba(212,175,55,0.14)] glass p-5"
          >
            <div className="mb-4 flex items-center gap-2">
              <FiBarChart2 className="text-gold-neon" size={16} />
              <span className="text-sm font-bold text-white">User Growth — This Week</span>
            </div>
            <div className="h-60">
              <Line data={userGrowthData} options={chartOptions} />
            </div>
          </motion.div>

          {/* Content Split doughnut */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06 }}
            className="rounded-2xl border border-[rgba(212,175,55,0.14)] glass p-5"
          >
            <div className="mb-4 flex items-center gap-2">
              <FiLayers className="text-gold-neon" size={16} />
              <span className="text-sm font-bold text-white">Content Split</span>
            </div>
            <div className="h-60">
              <Doughnut data={contentSplitData} options={doughnutOptions} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 6 — Recent Users
      ══════════════════════════════════════════ */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="rounded-2xl border border-[rgba(212,175,55,0.14)] glass overflow-hidden"
        >
          <div className="flex items-center gap-2 border-b border-[rgba(212,175,55,0.10)] px-5 py-4">
            <FiUsers className="text-gold-neon" size={16} />
            <span className="text-sm font-bold text-white">Recent Users</span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(212,175,55,0.10)] text-left text-[11px] font-semibold uppercase tracking-widest text-soft-gray/70">
                <th className="px-5 py-3 w-10">#</th>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u, idx) => (
                <tr
                  key={u.id}
                  className="border-b border-[rgba(212,175,55,0.06)] transition-colors hover:bg-[rgba(212,175,55,0.04)]"
                >
                  <td className="px-5 py-3 text-soft-gray/60">{idx + 1}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar circle */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-DEFAULT/80 to-gold-soft/60 text-xs font-bold text-black">
                        {u.name[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-white">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-soft-gray/80">{u.email}</td>
                  <td className="px-5 py-3 text-soft-gray/80">{u.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </section>
    </div>
  );
}
