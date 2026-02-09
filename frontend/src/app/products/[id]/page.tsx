'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShoppingCart, Heart, Star, Truck, Shield, 
  ChevronLeft, ChevronRight, Minus, Plus, Share2,
  Check, Clock, Package, AlertCircle
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { productsApi, formatPrice, calculateDiscount } from '@/lib/services';
import type { Product, ProductVariant } from '@/types';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params.id);
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [detailTab, setDetailTab] = useState<'detail' | 'shipping' | 'reviews'>('detail');
  
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // 먼저 실제 API 호출 시도
        const data = await productsApi.getProduct(productId);
        setProduct(data);
        // 첫 번째 variant 자동 선택
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      } catch (apiError) {
        console.log('API 호출 실패, DummyJSON 폴백 사용');
        
        // 폴백: DummyJSON
        try {
          const response = await fetch(`https://dummyjson.com/products/${productId}`);
          if (!response.ok) throw new Error('Product not found');
          
          const dummyProduct = await response.json();
          const exchangeRate = 1350;
          const priceKrw = Math.round(dummyProduct.price * exchangeRate);
          const originalPriceKrw = Math.round(priceKrw / (1 - dummyProduct.discountPercentage / 100));
          
          setProduct({
            id: dummyProduct.id,
            external_id: `dummy-${dummyProduct.id}`,
            title: dummyProduct.title,
            title_ko: dummyProduct.title,
            description: dummyProduct.description,
            description_ko: dummyProduct.description,
            price_original: originalPriceKrw,
            price_final: priceKrw,
            currency: 'KRW',
            stock: dummyProduct.stock,
            is_active: true,
            category: dummyProduct.category,
            tags: [dummyProduct.brand],
            shipping_days_min: 7,
            shipping_days_max: 14,
            images: dummyProduct.images.map((url: string, idx: number) => ({
              id: idx,
              product_id: dummyProduct.id,
              url,
              is_main: idx === 0,
              sort_order: idx,
            })),
            created_at: new Date().toISOString(),
          });
        } catch (fallbackError) {
          setError('상품을 찾을 수 없습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;
    
    const price = selectedVariant?.price_krw || product.price_final;
    const mainImage = product.images?.find(img => img.is_main)?.url || product.images?.[0]?.url;
    
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.title,
      nameKo: product.title_ko,
      price: product.price_original,
      priceKrw: price,
      quantity: quantity,
      imageUrl: mainImage,
      variant: selectedVariant?.name,
    });
    
    toast.success(`${quantity}개를 장바구니에 담았어요! 🛒`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">상품 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">😢</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">상품을 찾을 수 없어요</h2>
          <p className="text-gray-500 mb-6">{error || '요청하신 상품이 존재하지 않거나 삭제되었습니다.'}</p>
          <Link href="/products" className="btn-primary">
            상품 목록으로
          </Link>
        </div>
      </div>
    );
  }

  const priceKrw = selectedVariant?.price_krw || product.price_final;
  const originalPrice = product.price_original || Math.round(priceKrw * 1.3);
  const discountPercent = calculateDiscount(originalPrice, priceKrw);
  const currentStock = selectedVariant?.stock ?? product.stock;
  const images = product.images?.map(img => img.url) || [];
  const mainImage = images[selectedImage] || images[0] || '';
  
  // 랜덤 데이터 (실제 API에서 제공하지 않는 경우)
  const rating = (4 + Math.random() * 0.9).toFixed(1);
  const reviewCount = Math.floor(Math.random() * 5000) + 100;
  const soldCount = Math.floor(Math.random() * 20000) + 500;
  const supplierName = product.supplier?.name || 'KonaMall';

  return (
    <div className="min-h-screen bg-gray-50 pb-32 md:pb-8">
      {/* 뒤로가기 헤더 */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <button onClick={() => router.back()} className="p-2 -ml-2">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
              {product.title_ko || product.title}
            </h1>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setIsLiked(!isLiked);
                  toast(isLiked ? '찜 해제했어요' : '찜 목록에 추가했어요! ❤️');
                }}
                className="p-2"
              >
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('링크가 복사되었습니다!');
                }}
                className="p-2"
              >
                <Share2 className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* 이미지 갤러리 */}
          <div>
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden mb-4">
              <img
                src={mainImage}
                alt={product.title_ko || product.title}
                className="w-full h-full object-contain"
              />
              
              {/* 할인 배지 */}
              {discountPercent >= 10 && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                  -{discountPercent}%
                </span>
              )}

              {/* 공급자 뱃지 */}
              <span className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                {supplierName}
              </span>

              {/* 이미지 네비게이션 */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(prev => prev > 0 ? prev - 1 : images.length - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-white hover:bg-black/50"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setSelectedImage(prev => prev < images.length - 1 ? prev + 1 : 0)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-white hover:bg-black/50"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* 썸네일 */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx ? 'border-orange-500' : 'border-gray-200'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 상품 정보 */}
          <div>
            {/* 카테고리 */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-primary-600 font-medium">{product.category}</span>
            </div>

            {/* 상품명 */}
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              {product.title_ko || product.title}
            </h1>

            {/* 평점 & 판매량 */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{rating}</span>
                <span className="text-gray-400">({formatPrice(reviewCount)} 리뷰)</span>
              </div>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">{formatPrice(soldCount)}+ 판매</span>
            </div>

            {/* 가격 */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 mb-6">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold text-red-500">
                  {formatPrice(priceKrw)}
                </span>
                <span className="text-lg text-red-500">원</span>
                {discountPercent >= 10 && (
                  <span className="bg-red-500 text-white text-sm font-bold px-2 py-0.5 rounded ml-2">
                    -{discountPercent}%
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 line-through">{formatPrice(originalPrice)}원</span>
              </div>
            </div>

            {/* 옵션 선택 (Variant) */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">옵션 선택</label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={variant.stock === 0}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedVariant?.id === variant.id
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : variant.stock === 0
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      {variant.name}
                      {variant.stock === 0 && <span className="ml-1 text-xs">(품절)</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 배송 정보 */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm">
                <Truck className="w-5 h-5 text-green-500" />
                <span className="text-green-600 font-medium">무료배송</span>
                <span className="text-gray-400">30,000원 이상 구매 시</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-5 h-5 text-blue-500" />
                <span>예상 배송: {product.shipping_days_min}-{product.shipping_days_max}일</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-5 h-5 text-purple-500" />
                <span>구매자 보호 프로그램 적용</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Package className="w-5 h-5 text-orange-500" />
                <span className={currentStock <= 10 ? 'text-red-500 font-medium' : ''}>
                  재고: {currentStock}개 {currentStock <= 10 && '(품절 임박!)'}
                </span>
              </div>
            </div>

            {/* 수량 선택 */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-gray-700 font-medium">수량</span>
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-gray-100 disabled:opacity-50"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                  className="p-3 hover:bg-gray-100 disabled:opacity-50"
                  disabled={quantity >= currentStock}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm text-gray-500">
                총 {formatPrice(priceKrw * quantity)}원
              </span>
            </div>

            {/* 재고 없음 경고 */}
            {currentStock === 0 && (
              <div className="flex items-center gap-2 p-4 bg-red-50 rounded-lg mb-6">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-600 font-medium">현재 품절된 상품입니다.</span>
              </div>
            )}

            {/* 구매 버튼 (데스크톱) */}
            <div className="hidden md:flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={currentStock === 0}
                className="flex-1 py-4 border-2 border-primary-500 text-primary-500 rounded-xl font-bold hover:bg-primary-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                장바구니
              </button>
              <button
                onClick={handleBuyNow}
                disabled={currentStock === 0}
                className="flex-1 py-4 bg-gradient-to-r from-primary-500 to-orange-500 text-white rounded-xl font-bold hover:from-primary-600 hover:to-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                바로 구매
              </button>
            </div>

            {/* 알리/테무 스타일 탭: 상세정보 / 배송·교환 / 리뷰 */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex border-b border-gray-200 mb-4">
                {[
                  { id: 'detail' as const, label: '상세정보' },
                  { id: 'shipping' as const, label: '배송·교환' },
                  { id: 'reviews' as const, label: `리뷰 (${reviewCount})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDetailTab(tab.id)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      detailTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {detailTab === 'detail' && (
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {product.description_ko || product.description || '상품 설명이 없습니다.'}
                  </p>
                </div>
              )}
              {detailTab === 'shipping' && (
                <div className="text-gray-600 space-y-3 text-sm">
                  <p><strong>배송 안내</strong></p>
                  <p>· 배송 기간: 주문 후 {product.shipping_days_min}~{product.shipping_days_max}일 소요 (해외 배송 포함)</p>
                  <p>· 30,000원 이상 구매 시 무료배송</p>
                  <p>· 교환/반품: 수령일로부터 7일 이내 미개봉 시 가능</p>
                </div>
              )}
              {detailTab === 'reviews' && (
                <div className="text-center py-8 text-gray-500">
                  <p>아직 리뷰가 없어요. 첫 리뷰를 남겨보세요!</p>
                </div>
              )}
            </div>

            {/* 신뢰 배지 */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Check className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <span className="text-xs text-gray-600">정품 보장</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Shield className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <span className="text-xs text-gray-600">안전 결제</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Truck className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <span className="text-xs text-gray-600">배송 추적</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 하단 구매 버튼 */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden z-50">
        <div className="flex gap-3">
          <button
            onClick={handleAddToCart}
            disabled={currentStock === 0}
            className="w-14 h-14 border-2 border-primary-500 text-primary-500 rounded-xl flex items-center justify-center disabled:opacity-50"
          >
            <ShoppingCart className="w-6 h-6" />
          </button>
          <button
            onClick={handleBuyNow}
            disabled={currentStock === 0}
            className="flex-1 bg-gradient-to-r from-primary-500 to-orange-500 text-white rounded-xl font-bold hover:from-primary-600 hover:to-orange-600 transition-colors disabled:opacity-50"
          >
            {formatPrice(priceKrw * quantity)}원 구매하기
          </button>
        </div>
      </div>
    </div>
  );
}
