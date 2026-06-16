import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiSearch, FiClock, FiSend, FiTrash2 } from "react-icons/fi";

function SkeletonLine() {
  return (
    <div className="h-16 animate-pulse rounded-2xl border border-[rgba(212,175,55,0.10)] bg-black-DEFAULT/10" />
  );
}

export default function NotificationsPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(t);
  }, []);

  const history = useMemo(
    () => [
      { id: "N1", title: "Weekend Premier", channel: "Push", time: "2h ago", status: "Sent" },
      { id: "N2", title: "Gold Subscription Offer", channel: "Email", time: "Yesterday", status: "Sent" },
      { id: "N3", title: "Live Event Reminder", channel: "Push", time: "3d ago", status: "Scheduled" },
    ],
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return history;
    return history.filter((n) => n.title.toLowerCase().includes(q) || n.channel.toLowerCase().includes(q));
  }, [history, query]);

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <div className="text-xs font-semibold tracking-widest text-soft-gray">NOTIFICATIONS</div>
          <div className="mt-1 text-2xl font-extrabold metallic">Push Notification Panel</div>
          <div className="mt-1 text-sm text-soft-gray/90">Send, schedule, and view history (UI scaffold).</div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-2xl border border-[rgba(212,175,55,0.14)] bg-black-DEFAULT/15 px-3 py-2">
            <FiSearch className="text-gold-neon/70" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search history..."
              className="w-64 bg-transparent text-sm outline-none placeholder:text-white/40"
              aria-label="Search notification history"
            />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Sender */}
        <div className="xl:col-span-1 rounded-2xl border border-[rgba(212,175,55,0.14)] bg-black-DEFAULT/10 glass p-5">
          <div className="text-xs font-semibold tracking-widest text-soft-gray">SEND / SCHEDULE</div>
          <div className="mt-2 text-lg font-bold metallic">New Notification</div>

          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-soft-gray">Title</label>
              <input className="mt-2 w-full rounded-xl border border-[rgba(212,175,55,0.18)] bg-black-DEFAULT/25 px-4 py-3 text-sm text-white outline-none focus:border-gold-neon/60" placeholder="e.g. Live Event Tonight" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-soft-gray">Channel</label>
                <select className="mt-2 w-full rounded-xl border border-[rgba(212,175,55,0.18)] bg-black-DEFAULT/25 px-4 py-3 text-sm text-white outline-none focus:border-gold-neon/60">
                  <option>Push</option>
                  <option>Email</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-soft-gray">Type</label>
                <select className="mt-2 w-full rounded-xl border border-[rgba(212,175,55,0.18)] bg-black-DEFAULT/25 px-4 py-3 text-sm text-white outline-none focus:border-gold-neon/60">
                  <option>Immediate</option>
                  <option>Scheduled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-soft-gray">Message</label>
              <textarea className="mt-2 min-h-24 w-full resize-none rounded-xl border border-[rgba(212,175,55,0.18)] bg-black-DEFAULT/25 px-4 py-3 text-sm text-white outline-none focus:border-gold-neon/60" placeholder="Write your message..." />
            </div>

            <div className="flex items-center gap-2">
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-DEFAULT via-gold-soft to-gold-neon px-4 py-2 font-bold text-black shadow-premium hover:brightness-110">
                <FiSend /> Send
              </button>
              <button className="flex items-center justify-center gap-2 rounded-xl border border-[rgba(212,175,55,0.18)] bg-black-DEFAULT/20 px-4 py-2 text-white/80 hover:text-white">
                <FiClock /> Schedule
              </button>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="xl:col-span-2 rounded-2xl border border-[rgba(212,175,55,0.14)] bg-black-DEFAULT/10 glass p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold tracking-widest text-soft-gray">HISTORY</div>
              <div className="mt-2 text-lg font-bold metallic">Notification Logs</div>
            </div>
            <div className="text-xs text-soft-gray/80">Auto-stagger entries</div>
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <>
                <SkeletonLine />
                <SkeletonLine />
                <SkeletonLine />
              </>
            ) : (
              filtered.map((n, idx) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.03 }}
                  className="flex flex-col gap-3 rounded-2xl border border-[rgba(212,175,55,0.10)] bg-black-DEFAULT/15 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="text-sm font-bold text-white">{n.title}</div>
                    <div className="mt-1 text-xs text-soft-gray/85">
                      {n.channel} • {n.time}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={[
                        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                        n.status === "Sent"
                          ? "border-[rgba(212,175,55,0.30)] text-gold-soft"
                          : "border-[rgba(255,255,255,0.16)] text-soft-gray",
                      ].join(" ")}
                    >
                      {n.status}
                    </span>

                    <button className="rounded-xl border border-[rgba(255,80,80,0.22)] bg-black-DEFAULT/20 px-3 py-2 text-white/80 hover:text-white hover:border-[rgba(255,80,80,0.35)]" aria-label="Delete notification" onClick={() => {}}>
                      <FiTrash2 />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
            {!loading && filtered.length === 0 && (
              <div className="py-10 text-center text-soft-gray/80">No notifications match your search.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
