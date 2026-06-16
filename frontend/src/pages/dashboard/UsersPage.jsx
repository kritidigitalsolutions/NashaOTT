import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiTrash2,
  FiUser,
  FiEye,
  FiX,
  FiCopy,
  FiCheck,
  FiMail,
  FiPhone,
  FiCalendar,
  FiShield,
  FiLock,
} from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getAllUsers, deleteUser } from "../../api/adminApi";

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[60px_1.5fr_1.5fr_1.2fr_100px_120px_100px] items-center gap-4 rounded-xl border border-[rgba(212,175,55,0.06)] bg-black/10 px-4 py-3">
      {/* Sr.No */}
      <div className="h-4 w-6 animate-pulse rounded bg-[rgba(255,255,255,0.06)]" />
      {/* User */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 animate-pulse rounded-lg bg-[rgba(212,175,55,0.14)]" />
        <div className="h-3.5 w-24 animate-pulse rounded bg-[rgba(255,255,255,0.08)]" />
      </div>
      {/* Email */}
      <div className="h-3.5 w-36 animate-pulse rounded bg-[rgba(255,255,255,0.06)]" />
      {/* Phone */}
      <div className="h-3.5 w-28 animate-pulse rounded bg-[rgba(255,255,255,0.06)]" />
      {/* Status */}
      <div className="h-6 w-16 animate-pulse rounded-full bg-[rgba(255,255,255,0.04)]" />
      {/* Subscription */}
      <div className="h-5 w-20 animate-pulse rounded-full bg-[rgba(255,255,255,0.04)]" />
      {/* Actions */}
      <div className="flex gap-2">
        <div className="h-8 w-8 animate-pulse rounded-lg bg-[rgba(255,255,255,0.04)]" />
        <div className="h-8 w-8 animate-pulse rounded-lg bg-[rgba(255,255,255,0.04)]" />
      </div>
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!", { autoClose: 1000 });
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-2 inline-flex items-center justify-center text-soft-gray hover:text-gold-neon transition-colors p-1 rounded hover:bg-white/5"
      title="Copy"
    >
      {copied ? <FiCheck className="text-green-400 h-3 w-3" /> : <FiCopy className="h-3 w-3" />}
    </button>
  );
}

export default function UsersPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getAllUsers();
      if (res.data.success) {
        setUsers(res.data.users);
      } else {
        toast.error("Failed to load users");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "An error occurred fetching users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await deleteUser(id);
      if (res.data.success) {
        toast.success("User deleted successfully");
        setUsers((prev) => prev.filter((u) => u._id !== id));
        if (selectedUser && selectedUser._id === id) {
          setSelectedUser(null);
        }
      } else {
        toast.error(res.data.message || "Failed to delete user");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "An error occurred");
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q))
    );
  }, [users, query]);

  return (
    <div className="space-y-5 relative">
      <ToastContainer
        theme="dark"
        position="top-right"
        autoClose={2400}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <div className="text-xs font-semibold tracking-widest text-soft-gray">USERS</div>
          <div className="mt-1 text-2xl font-extrabold metallic">User Management</div>
          <div className="mt-1 text-sm text-soft-gray/90">
            View detailed profiles and manage user accounts.
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-2xl border border-[rgba(212,175,55,0.14)] bg-black/15 px-3 py-2">
            <FiSearch className="text-gold-neon/70" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users..."
              className="w-64 bg-transparent text-sm outline-none placeholder:text-white/40"
              aria-label="Search users"
            />
          </div>

          <div className="rounded-2xl border border-[rgba(212,175,55,0.14)] bg-black/15 px-4 py-2 text-xs text-soft-gray">
            Total: <span className="metallic font-bold">{users.length}</span>
          </div>
        </div>
      </motion.div>

      {/* Responsive Table Container */}
      <div className="rounded-2xl border border-[rgba(212,175,55,0.14)] bg-black/10 glass p-4 overflow-x-auto">
        <div className="min-w-[850px]">
          {/* Table Headers */}
          <div className="grid grid-cols-[60px_1.5fr_1.5fr_1.2fr_100px_120px_100px] items-center gap-4 px-4 py-2 border-b border-[rgba(212,175,55,0.15)] pb-3 text-soft-gray">
            <div className="text-xs font-bold tracking-widest uppercase">Sr. No.</div>
            <div className="text-xs font-bold tracking-widest uppercase">Name</div>
            <div className="text-xs font-bold tracking-widest uppercase">Email</div>
            <div className="text-xs font-bold tracking-widest uppercase">Phone</div>
            <div className="text-xs font-bold tracking-widest uppercase">Status</div>
            <div className="text-xs font-bold tracking-widest uppercase">Subscription</div>
            <div className="text-xs font-bold tracking-widest uppercase">Actions</div>
          </div>

          {/* Table Body */}
          <div className="mt-3 space-y-2">
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : (
              filtered.map((u, idx) => {
                return (
                  <motion.div
                    key={u._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.02 }}
                    className="grid grid-cols-[60px_1.5fr_1.5fr_1.2fr_100px_120px_100px] items-center gap-4 rounded-xl border border-[rgba(212,175,55,0.08)] bg-black/15 px-4 py-3 hover:bg-black/30 hover:border-[rgba(212,175,55,0.2)] transition-all duration-200"
                  >
                    {/* Sr.No */}
                    <div className="text-sm font-semibold text-soft-gray/80">
                      {String(idx + 1).padStart(2, "0")}
                    </div>

                    {/* Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[rgba(212,175,55,0.18)] bg-black/20 overflow-hidden">
                        {u.profileImage ? (
                          <img src={u.profileImage} alt={u.name} className="h-full w-full object-cover" />
                        ) : (
                          <FiUser className="text-gold-neon/80 h-4 w-4" />
                        )}
                      </div>
                      <div className="truncate font-bold text-white text-sm" title={u.name || "Nasha User"}>
                        {u.name || "Nasha User"}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="truncate text-sm text-soft-gray/90" title={u.email || "—"}>
                      {u.email || "—"}
                    </div>

                    {/* Phone */}
                    <div className="truncate text-sm text-soft-gray/90" title={u.phone || "—"}>
                      {u.phone || "—"}
                    </div>

                    {/* Status */}
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(34,197,94,0.30)] bg-green-500/5 px-2.5 py-0.5 text-xs font-semibold text-green-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        Active
                      </span>
                    </div>

                    {/* Subscription */}
                    <div>
                      <span className="inline-flex rounded-full border border-[rgba(212,175,55,0.25)] bg-gold-DEFAULT/5 px-2.5 py-0.5 text-xs font-semibold text-gold-soft">
                        Free Plan
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="rounded-lg border border-[rgba(212,175,55,0.18)] bg-black/20 p-2 text-white/80 hover:text-white hover:border-[rgba(212,175,55,0.35)] transition-all"
                        title="View Details"
                        aria-label="View user details"
                      >
                        <FiEye className="text-gold-soft h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(u._id)}
                        className="rounded-lg border border-[rgba(255,80,80,0.22)] bg-black/20 p-2 text-white/80 hover:text-white hover:border-[rgba(255,80,80,0.38)] transition-all"
                        title="Delete User"
                        aria-label="Delete user"
                      >
                        <FiTrash2 className="text-red-400 h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}

            {!loading && filtered.length === 0 && (
              <div className="py-10 text-center text-soft-gray/80">No users found.</div>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            {/* Backdrop close handler */}
            <div className="absolute inset-0" onClick={() => setSelectedUser(null)} />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[rgba(212,175,55,0.25)] bg-black p-6 shadow-[0_0_50px_rgba(212,175,55,0.15)] z-10 glass"
            >
              {/* Golden accent line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold-DEFAULT via-gold-neon to-gold-soft" />

              {/* Close Button */}
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 rounded-xl border border-[rgba(255,255,255,0.1)] bg-white/5 p-2 text-soft-gray hover:text-white hover:border-[rgba(212,175,55,0.3)] transition-all"
                aria-label="Close details"
              >
                <FiX className="h-4 w-4" />
              </button>

              {/* User Avatar + Basic Profile Header */}
              <div className="flex flex-col items-center text-center mt-4 pb-5 border-b border-[rgba(212,175,55,0.1)]">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-gold-DEFAULT bg-black/40 overflow-hidden shadow-lg shadow-gold-DEFAULT/15">
                  {selectedUser.profileImage ? (
                    <img src={selectedUser.profileImage} alt={selectedUser.name} className="h-full w-full object-cover" />
                  ) : (
                    <FiUser className="h-10 w-10 text-gold-neon/80" />
                  )}
                </div>
                <h3 className="mt-3 text-lg font-extrabold text-white tracking-wide">{selectedUser.name || "Nasha User"}</h3>
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-gold-DEFAULT/10 border border-gold-DEFAULT/20 px-2.5 py-0.5 text-[10px] font-bold text-gold-soft uppercase tracking-widest">
                  <FiShield className="h-3 w-3" /> {selectedUser.role || "USER"}
                </span>
              </div>

              {/* Detail Items */}
              <div className="mt-6 space-y-4 text-xs">
                {/* ID */}
                <div className="grid grid-cols-3 gap-2 py-1 items-center">
                  <div className="text-soft-gray/70 font-semibold flex items-center gap-1.5">
                    <FiShield className="text-gold-soft h-3.5 w-3.5 shrink-0" /> User ID
                  </div>
                  <div className="col-span-2 text-white font-mono text-[11px] bg-white/5 px-2.5 py-1 rounded border border-white/5 flex items-center justify-between">
                    <span className="truncate">{selectedUser._id}</span>
                    <CopyButton text={selectedUser._id} />
                  </div>
                </div>

                {/* Email */}
                <div className="grid grid-cols-3 gap-2 py-1 items-center">
                  <div className="text-soft-gray/70 font-semibold flex items-center gap-1.5">
                    <FiMail className="text-gold-soft h-3.5 w-3.5 shrink-0" /> Email
                  </div>
                  <div className="col-span-2 text-white flex items-center justify-between">
                    <span className="truncate">{selectedUser.email || "No Email Address"}</span>
                    {selectedUser.email && <CopyButton text={selectedUser.email} />}
                  </div>
                </div>

                {/* Phone */}
                <div className="grid grid-cols-3 gap-2 py-1 items-center">
                  <div className="text-soft-gray/70 font-semibold flex items-center gap-1.5">
                    <FiPhone className="text-gold-soft h-3.5 w-3.5 shrink-0" /> Phone
                  </div>
                  <div className="col-span-2 text-white flex items-center justify-between">
                    <span>{selectedUser.phone || "No Phone Number"}</span>
                    {selectedUser.phone && <CopyButton text={selectedUser.phone} />}
                  </div>
                </div>

                {/* Auth Provider */}
                <div className="grid grid-cols-3 gap-2 py-1 items-center">
                  <div className="text-soft-gray/70 font-semibold flex items-center gap-1.5">
                    <FiLock className="text-gold-soft h-3.5 w-3.5 shrink-0" /> Auth Provider
                  </div>
                  <div className="col-span-2 text-white">
                    <span className="inline-flex items-center gap-1 rounded bg-white/5 border border-white/10 px-2 py-0.5 font-semibold text-soft-gray uppercase">
                      {selectedUser.authProvider || "PHONE"}
                    </span>
                  </div>
                </div>

                {/* Profile Complete */}
                <div className="grid grid-cols-3 gap-2 py-1 items-center">
                  <div className="text-soft-gray/70 font-semibold flex items-center gap-1.5">
                    <FiUser className="text-gold-soft h-3.5 w-3.5 shrink-0" /> Profile Complete
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-semibold ${
                        selectedUser.profileComplete
                          ? "bg-green-500/10 border border-green-500/20 text-green-400"
                          : "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {selectedUser.profileComplete ? "Complete" : "Incomplete"}
                    </span>
                  </div>
                </div>

                {/* Created At */}
                <div className="grid grid-cols-3 gap-2 py-1 items-center">
                  <div className="text-soft-gray/70 font-semibold flex items-center gap-1.5">
                    <FiCalendar className="text-gold-soft h-3.5 w-3.5 shrink-0" /> Joined Date
                  </div>
                  <div className="col-span-2 text-white">
                    {selectedUser.createdAt
                      ? new Date(selectedUser.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </div>
                </div>
              </div>

              {/* Close footer button */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="rounded-2xl border border-[rgba(212,175,55,0.2)] bg-black/40 px-5 py-2 text-xs font-bold text-soft-gray hover:text-gold-soft hover:border-[rgba(212,175,55,0.4)] transition-all"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
