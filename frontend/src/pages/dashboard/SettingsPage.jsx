import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiUpload, FiSettings, FiGlobe } from "react-icons/fi";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold tracking-wide text-soft-gray">
        {label}
      </span>
      {children}
    </label>
  );
}

function GoldButton({ children }) {
  return (
    <button className="rounded-xl bg-gradient-to-r from-gold-DEFAULT via-gold-soft to-gold-neon px-4 py-2 font-bold text-black shadow-premium hover:brightness-110">
      {children}
    </button>
  );
}

export default function SettingsPage() {
  const tabs = useMemo(
    () => [
      { key: "general", label: "General" },
      { key: "branding", label: "OTT Branding" },
      { key: "smtp", label: "SMTP Settings" },
      { key: "firebase", label: "Firebase Settings" },
      { key: "cdn", label: "Bunny CDN" },
      { key: "aws", label: "AWS Settings" },
      { key: "seo", label: "SEO Settings" },
    ],
    []
  );

  const [active, setActive] = useState("general");

  useEffect(() => {
    // keep active in sync with future query params (stub)
  }, [active]);

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <div className="text-xs font-semibold tracking-widest text-soft-gray">
            SETTINGS
          </div>
          <div className="mt-1 text-2xl font-extrabold metallic flex items-center gap-2">
            <FiSettings />
            Enterprise Configuration
          </div>
          <div className="mt-1 text-sm text-soft-gray/90">
            Update branding, CDN, email, and SEO settings (UI scaffold).
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-[rgba(212,175,55,0.16)] bg-black-DEFAULT/15 glass px-4 py-3 text-sm text-soft-gray">
            <span className="metallic font-bold">Secure</span> • Admin-only
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
        {/* Tabs */}
        <div className="xl:col-span-1">
          <div className="rounded-2xl border border-[rgba(212,175,55,0.14)] bg-black-DEFAULT/10 glass p-3">
            <div className="mb-2 text-xs font-semibold tracking-widest text-soft-gray">
              SECTIONS
            </div>
            <div className="space-y-1">
              {tabs.map((t) => {
                const isActive = active === t.key;
                return (
                  <button
                    key={t.key}
                    className={[
                      "w-full rounded-xl px-3 py-2 text-left text-sm transition",
                      isActive
                        ? "bg-[rgba(212,175,55,0.14)] text-white gold-border"
                        : "text-white/70 hover:text-white hover:bg-[rgba(212,175,55,0.06)]",
                    ].join(" ")}
                    onClick={() => setActive(t.key)}
                    type="button"
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="xl:col-span-3">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-[rgba(212,175,55,0.14)] bg-black-DEFAULT/10 glass p-5"
          >
            {/* General */}
            {active === "general" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(212,175,55,0.18)] bg-black-DEFAULT/20">
                    <FiSettings className="text-gold-neon/80" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold tracking-widest text-soft-gray">
                      GENERAL
                    </div>
                    <div className="mt-1 text-lg font-bold metallic">
                      Application Preferences
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Admin Display Name">
                    <input
                      defaultValue="NASHA OTT Admin"
                      className="w-full rounded-xl border border-[rgba(212,175,55,0.18)] bg-black-DEFAULT/25 px-4 py-3 text-sm text-white outline-none focus:border-gold-neon/60"
                    />
                  </Field>

                  <Field label="Default Country">
                    <select className="w-full rounded-xl border border-[rgba(212,175,55,0.18)] bg-black-DEFAULT/25 px-4 py-3 text-sm text-white outline-none focus:border-gold-neon/60">
                      <option>India</option>
                      <option>UAE</option>
                      <option>USA</option>
                    </select>
                  </Field>
                </div>

                <GoldButton>Save General Settings</GoldButton>
              </div>
            )}

            {/* Branding */}
            {active === "branding" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(212,175,55,0.18)] bg-black-DEFAULT/20">
                    <FiGlobe className="text-gold-neon/80" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold tracking-widest text-soft-gray">
                      OTT BRANDING
                    </div>
                    <div className="mt-1 text-lg font-bold metallic">
                      Logo & Banner Upload
                    </div>
                  </div>
                </div>

                <Field label="App Logo Upload">
                  <div className="flex items-center gap-3 rounded-xl border border-[rgba(212,175,55,0.18)] bg-black-DEFAULT/25 px-4 py-3">
                    <FiUpload className="text-gold-neon/80" />
                    <span className="text-sm text-soft-gray/90">Choose file (stub)</span>
                  </div>
                </Field>

                <Field label="Banner Upload">
                  <div className="flex items-center gap-3 rounded-xl border border-[rgba(212,175,55,0.18)] bg-black-DEFAULT/25 px-4 py-3">
                    <FiUpload className="text-gold-neon/80" />
                    <span className="text-sm text-soft-gray/90">Choose file (stub)</span>
                  </div>
                </Field>

                <GoldButton>Save Branding</GoldButton>
              </div>
            )}

            {/* SMTP */}
            {active === "smtp" && (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold tracking-widest text-soft-gray">
                    SMTP SETTINGS
                  </div>
                  <div className="mt-1 text-lg font-bold metallic">
                    Email Delivery Configuration
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="SMTP Host">
                    <input className="w-full rounded-xl border border-[rgba(212,175,55,0.18)] bg-black-DEFAULT/25 px-4 py-3 text-sm text-white outline-none focus:border-gold-neon/60" placeholder="smtp.example.com" />
                  </Field>
                  <Field label="SMTP Port">
                    <input className="w-full rounded-xl border border-[rgba(212,175,55,0.18)] bg-black-DEFAULT/25 px-4 py-3 text-sm text-white outline-none focus:border-gold-neon/60" placeholder="587" />
                  </Field>
                  <Field label="SMTP User">
                    <input className="w-full rounded-xl border border-[rgba(212,175,55,0.18)] bg-black-DEFAULT/25 px-4 py-3 text-sm text-white outline-none focus:border-gold-neon/60" placeholder="username" />
                  </Field>
                  <Field label="SMTP Password">
                    <input className="w-full rounded-xl border border-[rgba(212,175,55,0.18)] bg-black-DEFAULT/25 px-4 py-3 text-sm text-white outline-none focus:border-gold-neon/60" placeholder="••••••••" type="password" />
                  </Field>
                </div>

                <GoldButton>Save SMTP Settings</GoldButton>
              </div>
            )}

            {/* Other stubs */}
            {active !== "general" &&
              active !== "branding" &&
              active !== "smtp" && (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-semibold tracking-widest text-soft-gray">
                      {active.toUpperCase().replace(/_/g, " ")}
                    </div>
                    <div className="mt-1 text-lg font-bold metallic">
                      Configuration Form (stub)
                    </div>
                    <div className="mt-2 text-sm text-soft-gray/90">
                      This section is scaffolded for enterprise-grade settings. Wire to backend controllers later.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[rgba(212,175,55,0.10)] bg-black-DEFAULT/15 p-4 text-sm text-soft-gray/85">
                    Placeholder fields will be added in subsequent iterations.
                  </div>

                  <GoldButton>Save Changes</GoldButton>
                </div>
              )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
