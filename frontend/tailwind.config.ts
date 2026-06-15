import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legal-stationery palette
        paper: "#F6F2E9", // warm ivory
        "paper-deep": "#EDE7D8", // slightly deeper ivory for panels
        ink: "#1C1A17", // near-black warm ink
        "ink-soft": "#4A453D", // muted ink for secondary text
        oxblood: "#7A2E2A", // refined burgundy accent
        "oxblood-deep": "#5E211E",
        forest: "#2E3A2C", // supporting deep green
        line: "#D8D0BE", // hairline borders
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-newsreader)", "Georgia", "serif"],
        ui: ["var(--font-archivo)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        document: "0 24px 60px -28px rgba(28, 26, 23, 0.45)",
        panel: "0 1px 0 0 #D8D0BE",
      },
      backgroundImage: {
        grain:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

export default config;
