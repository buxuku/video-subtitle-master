/** @type {import('next').NextConfig} */
const { i18n } = require('../next-i18next.config')

module.exports = {
  i18n,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    return config
  },
}
