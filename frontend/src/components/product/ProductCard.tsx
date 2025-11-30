'use client';

import Link from 'next/link';
import { ShoppingCart, Heart, Star, Truck, Zap } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { formatPrice, calculateDiscount } from '@/lib/services';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'horizontal';
}

export default function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [isLiked, setIsLiked] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  // 이미지 URL 추출
  const images = product.images?.map(img => img.url) || [];
  const mainImage = images[0] || '';
  const currentImage = images[imageIndex] || mainImage;

  // 가격 계산
  const priceKrw = product.price_final;
  const originalPrice = product.price_original || Math.round(priceKrw * 1.3);
  const discountPercent = calculateDiscount(originalPrice, priceKrw);

  // 랜덤 데이터 (실제 API에서 제공하지 않는 경우)
  const rating = 4 + Math.random() * 0.9;
  const reviewCount = Math.floor(Math.random() * 5000) + 100;
  const soldCount = Math.floor(Math.random() * 20000) + 500;
  const supplierName = product.supplier?.name || ['Temu', 'AliExpress', 'Amazon'][Math.floor(Math.random() * 3)];
  const isHot = discountPercent >= 30 || rating >= 4.7;
  const freeShipping = priceKrw >= 30000;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.title,
      nameKo: product.title_ko,
      price: product.price_original,
      priceKrw: product.price_final,
      quantity: 1,
      imageUrl: mainImage,
    });
    toast.success('장바구니에 담았어요! 🛒', {
      style: {
        background: '#1f2937',
        color: '#fff',
        borderRadius: '50px',
      },
    });
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
    toast(isLiked ? '찜 해제했어요' : '찜 목록에 추가했어요! ❤️', {
      icon: isLiked ? '💔' : '❤️',
      style: {
        borderRadius: '50px',
      },
    });
  };

  const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';

  if (variant === 'horizontal') {
    return (
      <Link href={`/products/${product.id}`}>
        <div className="flex bg-white rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all p-3 gap-3">
          <div className="w-28 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
            <img
              src={imgError ? placeholderImage : (currentImage || placeholderImage)}
              alt={product.title_ko || product.title}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
            {discountPercent >= 30 && (
              <span className="absolute top-1 left-1 sale-badge text-[10px]">
                -{discountPercent}%
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
              {product.title_ko || product.title}
            </h3>
            <div className="flex items-center gap-1 mb-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-gray-600">{rating.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({formatPrice(reviewCount)})</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-red-500">
                {formatPrice(priceKrw)}원
              </span>
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(originalPrice)}원
              </span>
            </div>
            {freeShipping && (
              <span className="inline-flex items-center gap-1 text-[10px] text-green-600 mt-1">
                <Truck className="w-3 h-3" /> 무료배송
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200">
        {/* 이미지 영역 */}
        <div 
          className="relative aspect-square bg-gray-100 overflow-hidden"
          onMouseEnter={() => images.length > 1 && setImageIndex(1)}
          onMouseLeave={() => setImageIndex(0)}
        >
          <img
            src={imgError ? placeholderImage : (currentImage || placeholderImage)}
            alt={product.title_ko || product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
            loading="lazy"
          />
          
          {/* 배지들 */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {discountPercent >= 30 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                -{discountPercent}%
              </span>
            )}
            {isHot && (
              <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Zap className="w-3 h-3" /> HOT
              </span>
            )}
          </div>

          {/* 찜하기 버튼 */}
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

          {/* 공급자 태그 */}
          <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full z-10">
            {supplierName}
          </span>
        </div>

        {/* 상품 정보 */}
        <div className="p-3">
          {/* 상품명 */}
          <h3 className="text-sm text-gray-800 line-clamp-2 mb-2 min-h-[2.5rem] leading-tight">
            {product.title_ko || product.title}
          </h3>

          {/* 가격 */}
          <div className="mb-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-red-500">
                {formatPrice(priceKrw)}
              </span>
              <span className="text-sm font-medium text-red-500">원</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(originalPrice)}원
              </span>
            </div>
          </div>

          {/* 평점 & 판매량 */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-gray-700">{rating.toFixed(1)}</span>
              <span className="text-gray-400">({formatPrice(reviewCount)})</span>
            </div>
            <span>{formatPrice(soldCount)}+ sold</span>
          </div>

          {/* 무료배송 & 장바구니 */}
          <div className="flex items-center justify-between">
            {freeShipping ? (
              <span className="flex items-center gap-1 text-[11px] text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <Truck className="w-3 h-3" /> 무료배송
              </span>
            ) : (
              <span />
            )}
            <button
              onClick={handleAddToCart}
              className="p-2.5 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-all active:scale-90 shadow-md"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
