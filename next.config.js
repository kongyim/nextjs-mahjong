/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  assetPrefix: '.',
  output: 'export',
  generateBuildId: async () => 'static-build',
};

module.exports = nextConfig;
