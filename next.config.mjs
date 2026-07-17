/** @type {import('next').NextConfig} */
const nextConfig = {
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
