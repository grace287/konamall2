'use client';

import Link from 'next/link';
import { ChevronRight, Star, ShoppingCart, Heart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';
import { useState } from 'react';

// 베스트셀러 상품 데이터 (실제 이미지 URL 포함)
const bestProducts = [
  {
    id: 1,
    name: '프리미엄 무선 이어폰',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
    priceKrw: 24900,
    originalPrice: 45000,
    discount: 45,
    rating: 5,
    reviewCount: 2341,
    badge: 'discount',
  },
  {
    id: 2,
    name: '캐주얼 나일론 백팩',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop',
    priceKrw: 18900,
    originalPrice: 35000,
    discount: 46,
    rating: 4,
    reviewCount: 1856,
    badge: 'hot',
  },
  {
    id: 3,
    name: 'LED 스탠드 조명',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
    priceKrw: 12900,
    originalPrice: 32000,
    discount: 60,
    rating: 5,
    reviewCount: 978,
    badge: 'discount',
  },
  {
    id: 4,
    name: '스포츠 러닝화',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop',
    priceKrw: 29900,
    originalPrice: 46000,
    discount: 35,
    rating: 5,
    reviewCount: 3421,
    badge: 'discount',
  },
  {
    id: 5,
    name: '선글라스 UV 보호',
    imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=300&fit=crop',
    priceKrw: 9900,
    originalPrice: 25000,
    discount: 60,
    rating: 4,
    reviewCount: 1234,
    badge: 'hot',
  },
  {
    id: 6,
    name: '스마트워치 피트니스',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop',
    priceKrw: 34900,
    originalPrice: 69000,
    discount: 50,
    rating: 5,
    reviewCount: 2567,
    badge: 'discount',
  },
  {
    id: 7,
    name: '블루투스 스피커',
    imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop',
    priceKrw: 15900,
    originalPrice: 26500,
    discount: 40,
    rating: 5,
    reviewCount: 4123,
    badge: 'discount',
  },
  {
    id: 8,
    name: '여성용 손가락 반지',
    imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=300&h=300&fit=crop',
    priceKrw: 4900,
    originalPrice: 12000,
    discount: 59,
    rating: 4,
    reviewCount: 567,
    badge: 'new',
  },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat('ko-KR').format(price);
}

function ProductCard({ product }: { product: typeof bestProducts[0] }) {
  const addItem = useCartStore((state) => state.addItem);
  const [isLiked, setIsLiked] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: product.id,
      name: product.name,
      nameKo: product.name,
      price: product.originalPrice,
      priceKrw: product.priceKrw,
      quantity: 1,
      imageUrl: product.imageUrl,
    });
    toast.success('장바구니에 담았어요! 🛒');
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLiked(!isLiked);
    toast(isLiked ? '찜 해제했어요' : '찜 목록에 추가했어요! ❤️', {
      icon: isLiked ? '💔' : '❤️',
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'fill-gray-200 text-gray-200'
        }`}
      />
    ));
  };

  return (
    <Link href={`/products/${product.id}`} className="block group">
      <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200">
        {/* 이미지 영역 */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          
          {/* 배지 */}
          {product.badge === 'discount' && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              -{product.discount}%
            </span>
          )}
          {product.badge === 'hot' && (
            <span className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              HOT
            </span>
          )}
          {product.badge === 'new' && (
            <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
              NEW
            </span>
          )}

          {/* 찜 버튼 */}
          <button
            onClick={handleLike}
            className={`absolute top-2 right-2 p-2 rounded-full transition-all z-10 ${
              isLiked
                ? 'bg-red-500 text-white'
                : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* 상품 정보 */}
        <div className="p-3">
          <h3 className="text-sm text-gray-800 line-clamp-2 mb-2 min-h-[2.5rem] leading-tight font-medium">
            {product.name}
          </h3>

          {/* 가격 */}
          <div className="mb-2">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-red-500">
                ₩{formatPrice(product.priceKrw)}
              </span>
            </div>
            <span className="text-xs text-gray-400 line-through">
              ₩{formatPrice(product.originalPrice)}
            </span>
          </div>

          {/* 평점 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="flex">{renderStars(product.rating)}</div>
              <span className="text-xs text-gray-500">
                ({formatPrice(product.reviewCount)})
              </span>
            </div>
            <button
              onClick={handleAddToCart}
              className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-all active:scale-90"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function BestSellers() {
  return (
    <section className="bg-white py-6 md:py-8">
      <div className="container mx-auto px-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>⭐</span>
            베스트 셀러
          </h2>
          <Link
            href="/products"
            className="text-primary-500 text-sm font-medium flex items-center gap-1 hover:text-primary-600"
          >
            더보기 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 상품 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {bestProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
