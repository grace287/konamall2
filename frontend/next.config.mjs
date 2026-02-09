/** @type {import('next').NextConfig} */
const nextConfig = {
  // 프로덕션 빌드에서만 standalone (개발 시 ChunkLoadError 방지)
  ...(process.env.NODE_ENV === 'production' ? { output: 'standalone' } : {}),
  // 개발 시 청크 타임아웃 완화
  webpack: (config, { dev }) => {
    if (dev) {
      config.infrastructureLogging = { level: 'warn' };
    }
    return config;
  },
  
  // 이미지 최적화 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // 프로덕션 환경 설정
  compress: true,
  poweredByHeader: false,
  
  // API 프록시 설정 (개발 환경용)
  async rewrites() {
    // 프로덕션에서는 환경 변수 사용
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
  
  // 보안 헤더
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
