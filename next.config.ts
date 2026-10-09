import type { NextConfig } from 'next'

/**
 * Every legacy URL on the old storefront ends in a slash
 * (`/shop/`, `/product/<slug>/`, `/product-category/<path>/`), so `trailingSlash`
 * stays on to keep those URLs canonical and avoid a redirect hop for each one.
 */
const nextConfig: NextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    // Local, pre-optimised assets need no remote patterns beyond the brand CDN
    // that serves the homepage banners.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.jsdelivr.net' }],
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [96, 128, 192, 256, 320, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async redirects() {
    return [
      // The old storefront exposed categories under a compatibility path.
      // The trailing slash is part of the destination so a legacy link resolves
      // in one hop instead of two.
      { source: '/category/:path*', destination: '/product-category/:path*/', permanent: true },
      // WooCommerce pages that intentionally do not exist any more: commerce now
      // happens on WhatsApp, so send the traffic somewhere useful.
      { source: '/shopping-cart', destination: '/shop/', permanent: true },
      { source: '/cart', destination: '/shop/', permanent: true },
      { source: '/checkout', destination: '/shop/', permanent: true },
      { source: '/my-account', destination: '/contact-us/', permanent: true },
      // Legacy taxonomy leftovers.
      { source: '/product-tag/:path*', destination: '/shop/', permanent: true },
    ]
  },
}

export default nextConfig
