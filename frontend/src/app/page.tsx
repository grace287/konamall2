import Link from 'next/link';
import ProductGrid from '@/components/product/ProductGrid';
import { 
  Truck, Shield, Clock, Gift, ChevronRight, 
  Zap, Percent, Star, TrendingUp 
} from 'lucide-react';

// 카테고리 데이터
const categories = [
  { id: 'all', name: '전체', icon: '🏠', color: 'from-gray-500 to-gray-600' },
  { id: 'electronics', name: '전자기기', icon: '📱', color: 'from-blue-500 to-blue-600' },
  { id: 'fashion', name: '패션', icon: '👕', color: 'from-pink-500 to-rose-500' },
  { id: 'home', name: '홈/리빙', icon: '🏡', color: 'from-green-500 to-emerald-500' },
  { id: 'beauty', name: '뷰티', icon: '💄', color: 'from-purple-500 to-violet-500' },
  { id: 'sports', name: '스포츠', icon: '⚽', color: 'from-orange-500 to-amber-500' },
  { id: 'toys', name: '완구', icon: '🧸', color: 'from-yellow-500 to-orange-400' },
  { id: 'auto', name: '자동차', icon: '🚗', color: 'from-slate-500 to-slate-600' },
];

// 프로모션 배너 데이터
const promos = [
  { 
    title: '신규회원 혜택', 
    subtitle: '첫 구매 시 3,000원 할인', 
    bg: 'from-violet-500 to-purple-600',
    icon: '🎁'
  },
  { 
    title: '타임딜', 
    subtitle: '매일 10시, 최대 80% OFF', 
    bg: 'from-red-500 to-pink-500',
    icon: '⏰'
  },
  { 
    title: '무료배송', 
    subtitle: '30,000원 이상 구매 시', 
    bg: 'from-emerald-500 to-teal-500',
    icon: '🚚'
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* 상단 프로모 띠배너 */}
      <div className="promo-banner text-center text-sm font-medium overflow-hidden">
        <div className="animate-pulse flex items-center justify-center gap-2">
          <Zap className="w-4 h-4" />
          <span>🔥 지금 가입하면 최대 70% 할인 + 무료배송 쿠폰 증정!</span>
          <Zap className="w-4 h-4" />
        </div>
      </div>

      {/* 히어로 섹션 - Temu 스타일 */}
      <section className="bg-gradient-to-br from-primary-500 via-orange-500 to-red-500 text-white">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
                <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                <span className="text-sm font-medium">글로벌 직구 No.1</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                전 세계 핫딜<br className="md:hidden" /> 한곳에서!
              </h1>
              <p className="text-lg md:text-xl mb-6 text-orange-100">
                Temu · AliExpress · Amazon 인기상품<br />
                원화 결제, 한글 상세정보로 쉽게!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link
                  href="/products"
                  className="btn-primary bg-white text-primary-600 hover:bg-gray-100 flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  인기상품 보기
                </Link>
                <Link
                  href="/deals"
                  className="btn-sale flex items-center justify-center gap-2"
                >
                  <Percent className="w-5 h-5" />
                  오늘의 특가
                </Link>
              </div>
            </div>
            
            {/* 히어로 이미지/카드 영역 */}
            <div className="hidden md:grid grid-cols-2 gap-4 max-w-md">
              {promos.slice(0, 2).map((promo, i) => (
                <div 
                  key={i}
                  className={`bg-gradient-to-br ${promo.bg} rounded-2xl p-4 text-white shadow-lg transform hover:scale-105 transition-transform`}
                >
                  <span className="text-3xl mb-2 block">{promo.icon}</span>
                  <h3 className="font-bold">{promo.title}</h3>
                  <p className="text-sm text-white/80">{promo.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 프로모 카드 (모바일용) */}
      <section className="md:hidden px-4 -mt-4">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide py-2">
          {promos.map((promo, i) => (
            <div 
              key={i}
              className={`bg-gradient-to-br ${promo.bg} rounded-xl p-3 text-white min-w-[140px] flex-shrink-0 shadow-md`}
            >
              <span className="text-2xl">{promo.icon}</span>
              <h3 className="font-bold text-sm mt-1">{promo.title}</h3>
              <p className="text-xs text-white/80">{promo.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 카테고리 네비게이션 */}
      <section className="bg-white mt-4 py-4">
        <div className="container mx-auto">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.id}`}
                className="flex flex-col items-center gap-2 min-w-[60px] group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform`}>
                  {cat.icon}
                </div>
                <span className="text-xs font-medium text-gray-700 group-hover:text-primary-600">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 신뢰 배지 */}
      <section className="bg-white border-t border-gray-100 py-4">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Truck className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-[10px] md:text-xs text-gray-600">무료배송</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-[10px] md:text-xs text-gray-600">안전결제</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-[10px] md:text-xs text-gray-600">빠른배송</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Gift className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-[10px] md:text-xs text-gray-600">적립혜택</span>
            </div>
          </div>
        </div>
      </section>

      {/* 타임딜 섹션 */}
      <section className="py-6 bg-gradient-to-r from-red-500 to-orange-500">
        <div className="container mx-auto px-4">
          <div className="section-header mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <h2 className="text-xl font-bold text-white">타임딜</h2>
                <p className="text-sm text-white/80">놓치면 후회할 특가!</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="countdown-box">02</div>
              <span className="text-white">:</span>
              <div className="countdown-box">34</div>
              <span className="text-white">:</span>
              <div className="countdown-box">56</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4">
            <ProductGrid limit={4} />
          </div>
        </div>
      </section>

      {/* 인기 상품 섹션 */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="section-header">
            <div className="section-title">
              <span className="text-2xl">🔥</span>
              <span>지금 가장 인기있는</span>
            </div>
            <Link 
              href="/products?sort=popular" 
              className="text-primary-500 text-sm font-medium flex items-center gap-1"
            >
              전체보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <ProductGrid limit={8} />
        </div>
      </section>

      {/* 신상품 섹션 */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="section-header">
            <div className="section-title">
              <span className="text-2xl">✨</span>
              <span>따끈따끈 신상품</span>
            </div>
            <Link 
              href="/products?sort=newest" 
              className="text-primary-500 text-sm font-medium flex items-center gap-1"
            >
              전체보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <ProductGrid limit={8} />
        </div>
      </section>

      {/* 카테고리별 추천 */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="section-header">
            <div className="section-title">
              <span className="text-2xl">📱</span>
              <span>전자기기 베스트</span>
            </div>
            <Link 
              href="/products?category=electronics" 
              className="text-primary-500 text-sm font-medium flex items-center gap-1"
            >
              전체보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <ProductGrid limit={4} category="electronics" />
        </div>
      </section>

      {/* 앱 다운로드 배너 */}
      <section className="py-8 bg-gradient-to-r from-dark-800 to-dark-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="text-white">
              <h3 className="text-xl font-bold mb-2">📲 앱 다운로드 시 5,000원 쿠폰!</h3>
              <p className="text-gray-400">앱에서만 제공되는 특별한 혜택을 받아보세요</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-white text-dark-800 px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-gray-100 transition-colors">
                <span>🍎</span> App Store
              </button>
              <button className="bg-white text-dark-800 px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-gray-100 transition-colors">
                <span>🤖</span> Google Play
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
