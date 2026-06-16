import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cool, modern SaaS palette (see CLAUDE.md "Color Scheme").
        canvas: "#F6F9FC", // page background
        surface: "#FFFFFF", // cards / panels
        navy: "#032147", // headings & strong text
        "navy-soft": "#0c3460", // hover/secondary navy
        ink: "#1F2A37", // body text
        muted: "#888888", // secondary text (CLAUDE.md gray)
        line: "#E3E8EF", // hairline borders
        blue: "#209DD7", // primary accent — actions, links, focus
        "blue-deep": "#1B86B9",
        yellow: "#ECAD0A", // highlight accent
        "yellow-deep": "#D29A08",
        purple: "#753991", // submit buttons (CLAUDE.md)
        "purple-deep": "#5E2D75",
      },
      fontFamily: {
        // App chrome is clean sans (Archivo). The document preview keeps a
        // serif (Newsreader) so the contract itself still reads formally.
        display: ["var(--font-archivo)", "system-ui", "sans-serif"],
        body: ["var(--font-archivo)", "system-ui", "sans-serif"],
        ui: ["var(--font-archivo)", "system-ui", "sans-serif"],
        serif: ["var(--font-newsreader)", "Georgia", "serif"],
      },
      boxShadow: {
        document: "0 24px 60px -28px rgba(3, 33, 71, 0.28)",
        panel: "0 1px 0 0 #E3E8EF",
      },
    },
  },
  plugins: [],
};

export default config;
