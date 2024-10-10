/** @type {import('next').NextConfig} */

module.exports = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  output: 'export',
  distDir: process.env.NODE_ENV === 'production' ? '../app' : '.next',
  webpack: (config) => {
    return config
  },
}
