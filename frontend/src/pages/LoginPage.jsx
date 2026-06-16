import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../api/adminApi";
import { useAuth } from "../context/AuthContext";

function InputField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold tracking-wide text-soft-gray">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: "onChange" });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const gradientClass = useMemo(
    () => "gold-border bg-black/10 border border-[rgba(212,175,55,0.20)]",
    []
  );

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await loginAdmin(data.email, data.password);
      if (res.data.success) {
        login(res.data.token, res.data.admin);
        toast.success("Login successful. Welcome back!");
        setTimeout(() => navigate("/dashboard", { replace: true }), 500);
      } else {
        toast.error(res.data.message || "Login failed. Please try again.");
      }
    } catch (e) {
      const msg =
        e?.response?.data?.message || "Invalid credentials. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
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

      {/* Cinematic background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-black-DEFAULT opacity-35" />
        <motion.div
          className="absolute left-[-20%] top-[-30%] h-[520px] w-[520px] rounded-full bg-gold-neon/15 blur-3xl"
          animate={{ x: [0, 25, 0], y: [0, -15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[-30%] bottom-[-35%] h-[620px] w-[620px] rounded-full bg-gold-soft/10 blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Light streak */}
        <motion.div
          className="absolute left-[10%] top-[20%] h-[1px] w-[140%] bg-gradient-to-r from-transparent via-gold-neon/60 to-transparent"
          animate={{ x: ["-30%", "30%"] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-[5%] top-[58%] h-[1px] w-[130%] bg-gradient-to-r from-transparent via-gold-soft/55 to-transparent"
          animate={{ x: ["-20%", "20%"] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Particles */}
        {Array.from({ length: 18 }).map((_, i) => {
          const left = 10 + Math.random() * 80;
          const top = 10 + Math.random() * 80;
          const delay = Math.random() * 2;
          const size = 2 + Math.random() * 3;
          return (
            <motion.div
              key={i}
              className="absolute rounded-full bg-gold-neon/70"
              style={{ left: `${left}%`, top: `${top}%`, width: size, height: size }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 1, 0.35], scale: [0.8, 1.15, 0.9], y: [-6, 8, -2] }}
              transition={{ duration: 3.2, delay, repeat: Infinity, ease: "easeInOut" }}
            />
          );
        })}
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md items-center justify-center px-4 py-10">
        <div className="w-full">
          {/* Login form */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative"
          >
            <div className={`relative rounded-3xl p-7 md:p-8 ${gradientClass} glass`}>
              <div className="mb-6">
                <div className="text-2xl font-extrabold tracking-tight">
                  Welcome, <span className="metallic">Admin</span>
                </div>
                <div className="mt-2 text-sm text-soft-gray">
                  Sign in to NASHA OTT enterprise dashboard.
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <InputField label="Email">
                  <input
                    type="email"
                    id="admin-email"
                    placeholder="admin@nashaott.com"
                    className="w-full rounded-xl border border-[rgba(212,175,55,0.18)] bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-gold-neon/60 focus:shadow-[0_0_0_1px_rgba(255,215,0,0.25)]"
                    {...register("email", { required: "Email is required" })}
                  />
                  {errors.email && (
                    <div className="mt-1 text-xs text-red-300">{errors.email.message}</div>
                  )}
                </InputField>

                <InputField label="Password">
                  <div className="relative">
                    <input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-[rgba(212,175,55,0.18)] bg-black/30 px-4 py-3 pr-12 text-sm text-white outline-none placeholder:text-white/40 focus:border-gold-neon/60 focus:shadow-[0_0_0_1px_rgba(255,215,0,0.25)]"
                      {...register("password", { required: "Password is required" })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-gold-soft transition"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.password && (
                    <div className="mt-1 text-xs text-red-300">
                      {errors.password.message}
                    </div>
                  )}
                </InputField>

                <div className="flex items-center justify-between gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-soft-gray">
                    <input type="checkbox" className="accent-gold-neon" defaultChecked {...register("rememberMe")} />
                    Remember me
                  </label>

                  <button
                    type="button"
                    className="text-sm text-soft-gray hover:text-gold-soft transition"
                    onClick={() => toast.info("Contact your system administrator to reset your password.")}
                  >
                    Forgot Password?
                  </button>
                </div>

                <motion.button
                  id="admin-login-btn"
                  type="submit"
                  disabled={loading}
                  className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-gold-DEFAULT via-gold-soft to-gold-neon px-5 py-3 font-bold text-black shadow-premium transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <span className="relative z-10">
                    {loading ? "Signing in…" : "Sign In"}
                  </span>
                  <motion.span
                    className="absolute top-0 left-0 h-full w-1/2 -translate-x-20 rotate-[15deg] bg-white/25 opacity-0"
                    initial={false}
                    whileHover={{ x: 260, opacity: 1 }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                  />
                </motion.button>

                <div className="text-center text-xs text-soft-gray">
                  By continuing, you agree to NASHA OTT Admin Terms.
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
