import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Supabase Storage(programs 버킷)의 프로그램 이미지
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
};

export default nextConfig;
