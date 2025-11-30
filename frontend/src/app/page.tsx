import Link from 'next/link';
import ProductGrid from '@/components/product/ProductGrid';
import FlashSaleBanner from '@/components/home/FlashSaleBanner';
import CategorySlider from '@/components/home/CategorySlider';
import BestSellers from '@/components/home/BestSellers';
import PromoBanner from '@/components/home/PromoBanner';
import TrustBadges from '@/components/home/TrustBadges';
import { ChevronRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* 24시간 플래시 세일 배너 */}
      <FlashSaleBanner />

      {/* 인기 카테고리 */}
      <CategorySlider />

      {/* 베스트 셀러 */}
      <BestSellers />

      {/* 신규 회원 프로모 배너 */}
      <PromoBanner />

      {/* 신상품 섹션 */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="section-header">
            <div className="section-title">
              <span className="text-2xl">✨</span>
              <span>따끈따끈 신상품</span>
            </div>
            <Link 
              href="/products?sort=newest" 
              className="text-primary-500 text-sm font-medium flex items-center gap-1 hover:text-primary-600"
            >
              전체보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <ProductGrid limit={8} />
        </div>
      </section>

      {/* 전자기기 베스트 */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="section-header">
            <div className="section-title">
              <span className="text-2xl">📱</span>
              <span>전자기기 베스트</span>
            </div>
            <Link 
              href="/products?category=electronics" 
              className="text-primary-500 text-sm font-medium flex items-center gap-1 hover:text-primary-600"
            >
              전체보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <ProductGrid limit={4} category="electronics" />
        </div>
      </section>

      {/* 패션 베스트 */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="section-header">
            <div className="section-title">
              <span className="text-2xl">👕</span>
              <span>패션 베스트</span>
            </div>
            <Link 
              href="/products?category=fashion" 
              className="text-primary-500 text-sm font-medium flex items-center gap-1 hover:text-primary-600"
            >
              전체보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <ProductGrid limit={4} category="fashion" />
        </div>
      </section>

      {/* 신뢰 배지 (빠른 배송, 정품보증, 안전결제) */}
      <TrustBadges />

      {/* 앱 다운로드 배너 */}
      <section className="py-8 bg-gradient-to-r from-gray-800 to-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="text-white">
              <h3 className="text-xl font-bold mb-2">📲 앱 다운로드 시 5,000원 쿠폰!</h3>
              <p className="text-gray-400">앱에서만 제공되는 특별한 혜택을 받아보세요</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-white text-gray-800 px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-gray-100 transition-colors">
                <span>🍎</span> App Store
              </button>
              <button className="bg-white text-gray-800 px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-gray-100 transition-colors">
                <span>🤖</span> Google Play
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
