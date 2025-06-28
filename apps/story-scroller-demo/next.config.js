/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ryleebrasseur/story-scroller'],
  experimental: {
    optimizePackageImports: ['@ryleebrasseur/story-scroller'],
  },
}

export default nextConfig