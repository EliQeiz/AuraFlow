/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Screenshot-derived AuraFlow palette: deep violet base, cyan CTA, and violet profile glow.
        "background-dark": "#0A0118",
        "background-panel": "#120D25",
        "primary-glow": "#6D5DFB",
        "accent-cyan": "#00E5FF",
        "accent-light-blue": "#5B7CFF",
        "accent-purple": "#8B5CF6",
        "accent-violet": "#A855F7",
        "text-main": "#F0F9FF",
        "text-muted": "#A8B3CF",
        "glass-backdrop": "rgba(17, 20, 45, 0.58)",
        aura: {
          violet: "#6C63FF",
          cyan: "#00D4FF",
          dark: "rgb(var(--aura-dark) / <alpha-value>)",
          surface: "rgb(var(--aura-surface) / <alpha-value>)",
          card: "rgb(var(--aura-card) / <alpha-value>)",
          ink: "rgb(var(--aura-ink) / <alpha-value>)",
          muted: "rgb(var(--aura-muted) / <alpha-value>)",
        },
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -18px, 0)" },
        },
        glow: {
          "0%, 100%": { opacity: "0.5", filter: "blur(42px)" },
          "50%": { opacity: "0.9", filter: "blur(58px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-180% 0" },
          "100%": { backgroundPosition: "180% 0" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        pulseSlow: {
          "0%, 100%": { opacity: "0.4", transform: "scale(0.98)" },
          "50%": { opacity: "1", transform: "scale(1.03)" },
        },
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        glow: "glow 8s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
        gradientShift: "gradientShift 12s ease infinite",
        "pulse-slow": "pulseSlow 3.8s ease-in-out infinite",
      },
      boxShadow: {
        // Use with hover transitions for the diffuse neon halo seen in the reference.
        "cyan-glow": "0 0 24px rgba(0, 229, 255, 0.42)",
        "purple-glow": "0 0 28px rgba(139, 92, 246, 0.45)",
        "card-glow": "0 20px 80px rgba(0, 229, 255, 0.10)",
        aura: "0 18px 80px rgba(108, 99, 255, 0.22)",
        cyan: "0 18px 70px rgba(0, 212, 255, 0.16)",
      },
      backgroundImage: {
        "cta-cyan": "linear-gradient(135deg, #00E5FF 0%, #5B7CFF 100%)",
        "profile-purple": "radial-gradient(circle at 30% 20%, #A855F7 0%, #6D5DFB 45%, #31205C 100%)",
        "aurora-field":
          "radial-gradient(circle at 15% 30%, rgba(109, 93, 251, 0.34), transparent 32%), radial-gradient(circle at 85% 28%, rgba(0, 229, 255, 0.24), transparent 28%), linear-gradient(135deg, #0A0118 0%, #090B1B 48%, #04131A 100%)",
        "aura-gradient": "linear-gradient(135deg, #6C63FF 0%, #00D4FF 100%)",
        "card-gradient":
          "linear-gradient(145deg, rgba(108, 99, 255, 0.16), rgba(18, 18, 42, 0.9), rgba(0, 212, 255, 0.08))",
        "hero-mesh":
          "radial-gradient(circle at 16% 18%, rgba(108, 99, 255, 0.38), transparent 32%), radial-gradient(circle at 84% 18%, rgba(0, 212, 255, 0.24), transparent 30%), radial-gradient(circle at 50% 88%, rgba(22, 217, 166, 0.16), transparent 36%)",
      },
      borderColor: {
        glass: "rgba(240, 249, 255, 0.14)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        orbitron: ["Orbitron", "ui-sans-serif", "system-ui"],
        syne: ["Syne", "ui-sans-serif", "system-ui"],
        dmSans: ["DM Sans", "ui-sans-serif", "system-ui"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
