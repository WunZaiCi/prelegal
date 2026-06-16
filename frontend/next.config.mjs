/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a fully static site to `out/` so FastAPI can serve it from a single
  // container. Trailing slashes make each route resolve to its own
  // `index.html` (e.g. `/login/` -> `out/login/index.html`).
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
