import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// No wildcard sources. Next.js requires inline bootstrap scripts/styles.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: http://127.0.0.1:54321 https://*.supabase.co https://cdn.discordapp.com https://*.seaofthieves.com https://*.azureedge.net https://i.ytimg.com https://img.youtube.com",
  "font-src 'self' data:",
  "connect-src 'self' http://127.0.0.1:54321 ws://127.0.0.1:54321 ws://localhost:54321 https://*.supabase.co wss://*.supabase.co",
  "media-src 'self' blob: http://127.0.0.1:54321 https://*.supabase.co",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
  "worker-src 'self' blob:",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "http", hostname: "127.0.0.1", port: "54321", pathname: "/storage/v1/object/public/gallery/**" },
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/gallery/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          ...(isProd
            ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
            : []),
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), autoplay=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
