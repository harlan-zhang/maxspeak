/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow streaming responses up to 5 minutes for large TTS requests
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Increase body size limit for audio file uploads
  serverRuntimeConfig: {
    maxBodySize: '25mb',
  },
};

module.exports = nextConfig;
