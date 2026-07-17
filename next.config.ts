import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Pin the workspace root to this project. Without this, Turbopack walks up
  // to c:\Users\jwate\Projects (note the space in "CFS Arizona") and fails to
  // resolve `@import "tailwindcss"`. process.cwd() is reliable because dev/build
  // are always launched from the project directory.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
