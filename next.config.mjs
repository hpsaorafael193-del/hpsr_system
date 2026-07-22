/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"]
  },
  images: {
    unoptimized: true
  },
  async redirects() {
    return [
      {
        source: "/dashboard/obstetricia",
        destination: "/dashboard/assistente-clinico",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
