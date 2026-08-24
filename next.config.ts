import type { NextConfig } from "next";
import path from "path";
import {
  MEDIA_CACHE_CONTROL,
  MEDIA_IMMUTABLE_CACHE_CONTROL,
} from "./src/lib/media-cache";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    // يسمح برفع صور عالية الدقة عبر Route Handlers / Proxy
    proxyClientMaxBodySize: "20mb",
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  async headers() {
    return [
      {
        source: "/login",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
      {
        source: "/register",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: MEDIA_IMMUTABLE_CACHE_CONTROL,
          },
        ],
      },
      {
        source: "/products/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: MEDIA_IMMUTABLE_CACHE_CONTROL,
          },
        ],
      },
      {
        source: "/brands/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: MEDIA_IMMUTABLE_CACHE_CONTROL,
          },
        ],
      },
      {
        source: "/brand/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: MEDIA_IMMUTABLE_CACHE_CONTROL,
          },
        ],
      },
      {
        source: "/api/catalog/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/api/media/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: MEDIA_CACHE_CONTROL,
          },
        ],
      },
    ];
  },
  // يسمح بفتح الموقع من الهاتف عبر IP الشبكة المحلية أثناء التطوير
  allowedDevOrigins: [
    "192.168.1.113",
    "localhost",
    "127.0.0.1",
  ],
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [384, 640, 750, 828, 1080],
    imageSizes: [64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
