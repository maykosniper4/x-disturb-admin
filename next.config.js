/**
 * @type {import('next').NextConfig}
 */
const path = require("path");

const nextConfig = {
  output: "standalone",
  images: {
    domains: ['i.pravatar.cc'],
  },
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname);
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/getentriesovertime',
        destination: 'https://getentriesovertime-jqk4tvz4xa-uc.a.run.app/',
      },
      {
        source: '/api/getentriesbylocation',
        destination: 'https://getentriesbylocation-jqk4tvz4xa-uc.a.run.app/',
      },
    ]
  },
}
 
module.exports = nextConfig
