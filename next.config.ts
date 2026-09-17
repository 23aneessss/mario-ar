import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'standalone', poweredByHeader: false,
  async headers() { return [{source: '/:path*', headers: [
    {key:'X-Content-Type-Options', value:'nosniff'},
    {key:'Referrer-Policy', value:'no-referrer'},
    {key:'Permissions-Policy', value:'camera=(self), microphone=(), geolocation=()'},
    {key:'X-Frame-Options', value:'DENY'}
  ]}, {source:'/p/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow, noarchive'}]}]; }
};
export default config;
