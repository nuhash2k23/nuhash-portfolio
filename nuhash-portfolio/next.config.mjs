/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // keeps WebGL contexts from being created twice in dev
  transpilePackages: ['three'],
  images: { formats: ['image/avif', 'image/webp'] },
};

export default nextConfig;
