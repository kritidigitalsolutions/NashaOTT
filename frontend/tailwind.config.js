/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        premium:
          "0 0 0 1px rgba(212,175,55,0.20), 0 10px 40px rgba(0,0,0,0.55)",
        goldGlow: "0 0 18px rgba(212,175,55,0.35), 0 0 40px rgba(247,215,116,0.18)",
      },
      colors: {
        "gold-DEFAULT": "var(--color-gold)",
        "gold-soft": "var(--color-gold-soft)",
        "gold-neon": "var(--color-gold-neon)",
        "black-DEFAULT": "var(--color-black)",
        "white-DEFAULT": "var(--color-white)",
        "soft-gray": "var(--color-soft-gray)",
      },
      backdropBlur: {
        luxury: "14px",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        marquee: {
          "0%": { transform: "translateX(-30%)" },
          "100%": { transform: "translateX(30%)" },
        },
        neonPulse: {
          "0%, 100%": {
            opacity: 0.55,
            filter: "drop-shadow(0 0 10px rgba(255,215,0,0.35))",
          },
          "50%": {
            opacity: 0.95,
            filter: "drop-shadow(0 0 18px rgba(255,215,0,0.60))",
          },
        },
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        floaty: "floaty 4s ease-in-out infinite",
        neonPulse: "neonPulse 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
