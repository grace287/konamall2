'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ShoppingCart, User, Menu, X, Search, Heart, 
  Package, ChevronDown, Bell, MapPin 
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

const categories = [
  { name: '전체', href: '/products' },
  { name: '전자기기', href: '/products?category=electronics' },
  { name: '패션', href: '/products?category=fashion' },
  { name: '홈/리빙', href: '/products?category=home' },
  { name: '뷰티', href: '/products?category=beauty' },
  { name: '스포츠', href: '/products?category=sports' },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="sticky top-0 z-50">
      {/* 상단바 */}
      <div className="bg-dark-800 text-white text-xs py-1.5 hidden md:block">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              배송지: 대한민국
            </span>
            <span>|</span>
            <span>한국어</span>
            <span>|</span>
            <span>KRW ₩</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/help" className="hover:text-primary-400">고객센터</Link>
            <Link href="/seller" className="hover:text-primary-400">판매자 센터</Link>
            <Link href="/app" className="hover:text-primary-400 flex items-center gap-1">
              📱 앱 다운로드
            </Link>
          </div>
        </div>
      </div>

      {/* 메인 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* 로고 */}
            <Link href="/" className="flex-shrink-0">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-orange-500 bg-clip-text text-transparent">
                KonaMall
              </span>
            </Link>

            {/* 검색바 */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:block">
              <div className="search-bar border-2 border-primary-500 rounded-full">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="오늘의 핫딜을 검색해보세요!"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3"
                />
                <button 
                  type="submit"
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-full -mr-1 transition-colors"
                >
                  검색
                </button>
              </div>
            </form>

            {/* 우측 아이콘들 */}
            <nav className="hidden md:flex items-center gap-1">
              <Link 
                href="/notifications" 
                className="p-3 rounded-full hover:bg-gray-100 transition-colors relative"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Link>
              
              <Link 
                href="/wishlist" 
                className="p-3 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Heart className="w-5 h-5 text-gray-600" />
              </Link>
              
              <Link 
                href="/cart" 
                className="p-3 rounded-full hover:bg-gray-100 transition-colors relative"
              >
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                {cartCount > 0 && (
                  <span className="absolute -top-0 -right-0 bg-primary-500 text-white text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
              
              <Link 
                href="/orders" 
                className="p-3 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Package className="w-5 h-5 text-gray-600" />
              </Link>
              
              <div className="h-6 w-px bg-gray-200 mx-2"></div>
              
              <Link 
                href="/login" 
                className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700">로그인</span>
              </Link>
            </nav>

            {/* 모바일 메뉴 버튼 */}
            <div className="flex items-center gap-2 md:hidden">
              <Link href="/cart" className="p-2 relative">
                <ShoppingCart className="w-6 h-6 text-gray-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-0 -right-0 bg-primary-500 text-white text-xs min-w-[16px] h-[16px] rounded-full flex items-center justify-center text-[10px] font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* 모바일 검색바 */}
          <div className="pb-3 md:hidden">
            <form onSubmit={handleSearch}>
              <div className="search-bar border border-gray-200">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="검색어를 입력하세요"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>
        </div>

        {/* 카테고리 네비게이션 - 데스크탑 */}
        <div className="border-t border-gray-100 hidden md:block">
          <div className="container mx-auto px-4">
            <nav className="flex items-center gap-1 py-2">
              <button className="flex items-center gap-1 px-4 py-2 bg-primary-500 text-white rounded-full text-sm font-medium">
                <Menu className="w-4 h-4" />
                카테고리
                <ChevronDown className="w-4 h-4" />
              </button>
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                href="/deals"
                className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-full transition-colors flex items-center gap-1"
              >
                🔥 특가
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-[120px] bg-white z-40 md:hidden overflow-y-auto animate-slide-down">
          <div className="p-4">
            {/* 로그인/회원가입 */}
            <div className="flex gap-3 mb-6">
              <Link 
                href="/login" 
                className="flex-1 py-3 text-center bg-primary-500 text-white rounded-xl font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                로그인
              </Link>
              <Link 
                href="/signup" 
                className="flex-1 py-3 text-center border border-gray-300 rounded-xl font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                회원가입
              </Link>
            </div>

            {/* 퀵메뉴 */}
            <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
              <Link 
                href="/orders" 
                className="flex flex-col items-center gap-1"
                onClick={() => setIsMenuOpen(false)}
              >
                <Package className="w-6 h-6 text-gray-600" />
                <span className="text-xs">주문내역</span>
              </Link>
              <Link 
                href="/wishlist" 
                className="flex flex-col items-center gap-1"
                onClick={() => setIsMenuOpen(false)}
              >
                <Heart className="w-6 h-6 text-gray-600" />
                <span className="text-xs">찜목록</span>
              </Link>
              <Link 
                href="/cart" 
                className="flex flex-col items-center gap-1"
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingCart className="w-6 h-6 text-gray-600" />
                <span className="text-xs">장바구니</span>
              </Link>
              <Link 
                href="/mypage" 
                className="flex flex-col items-center gap-1"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="w-6 h-6 text-gray-600" />
                <span className="text-xs">마이페이지</span>
              </Link>
            </div>

            {/* 카테고리 */}
            <div className="mb-6">
              <h3 className="font-bold mb-3 text-gray-800">카테고리</h3>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* 기타 메뉴 */}
            <div className="border-t pt-4">
              <Link 
                href="/help" 
                className="block py-3 text-gray-600"
                onClick={() => setIsMenuOpen(false)}
              >
                고객센터
              </Link>
              <Link 
                href="/notice" 
                className="block py-3 text-gray-600"
                onClick={() => setIsMenuOpen(false)}
              >
                공지사항
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
