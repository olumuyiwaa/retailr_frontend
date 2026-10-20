/** Hosts product photos may be served from: Unsplash (demo data), the API itself (local uploads), and anything listed in NEXT_PUBLIC_IMAGE_HOSTS (your S3/R2/CDN host, comma separated). */
const hostOf = (u) => { try { return new URL(u).hostname; } catch { return null; } };
const extra = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "").split(",").map((h) => h.trim()).filter(Boolean);
const hosts = [...new Set(["images.unsplash.com", hostOf(process.env.NEXT_PUBLIC_API_URL ?? ""), ...extra].filter(Boolean))];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: hosts.map((hostname) => ({ protocol: hostname === "localhost" ? "http" : "https", hostname })) },
};

module.exports = nextConfig;
