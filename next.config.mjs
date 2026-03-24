/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["10.200.10.54"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  logging: {
    browserToTerminal: true,
  },
}

export default nextConfig
