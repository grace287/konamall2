'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { 
  ShoppingCart, Heart, Star, Truck, Shield, 
  ChevronLeft, ChevronRight, Minus, Plus, Share2,
  Check, Clock, Package
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  category: string;
  thumbnail: string;
  images: string[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  
  const addItem = useCartStore((state) => state.addItem);
  
  const exchangeRate = 1350;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`https://dummyjson.com/products/${productId}`);
        setProduct(response.data);
      } catch (error) {
        console.error('상품을 불러오는데 실패했습니다:', error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    const priceKrw = Math.round(product.price * exchangeRate);
    
    addItem({
      productId: product.id,
      name: product.title,
      nameKo: product.title,
      price: product.price,
      priceKrw: priceKrw,
      quantity: quantity,
      imageUrl: product.thumbnail,
    });
    
    toast.success(`${quantity}개를 장바구니에 담았어요! 🛒`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    window.location.href = '/cart';
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

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">😢</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">상품을 찾을 수 없어요</h2>
          <p className="text-gray-500 mb-6">요청하신 상품이 존재하지 않거나 삭제되었습니다.</p>
          <Link href="/products" className="btn-primary">
            상품 목록으로
          </Link>
        </div>
      </div>
    );
  }

  const priceKrw = Math.round(product.price * exchangeRate);
  const originalPrice = Math.round(priceKrw / (1 - product.discountPercentage / 100));
  const reviewCount = Math.floor(Math.random() * 5000) + 100;
  const soldCount = Math.floor(Math.random() * 20000) + 500;

  return (
    <div className="min-h-screen bg-gray-50 pb-32 md:pb-8">
      {/* 뒤로가기 헤더 */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <button onClick={() => window.history.back()} className="p-2 -ml-2">
              <ChevronLeft className="w-6 h-6" />
            </button>
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
              <button className="p-2">
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
                src={product.images[selectedImage] || product.thumbnail}
                alt={product.title}
                className="w-full h-full object-contain"
              />
              
              {/* 할인 배지 */}
              {product.discountPercentage >= 10 && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                  -{Math.round(product.discountPercentage)}%
                </span>
              )}

              {/* 이미지 네비게이션 */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(prev => prev > 0 ? prev - 1 : product.images.length - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-white hover:bg-black/50"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setSelectedImage(prev => prev < product.images.length - 1 ? prev + 1 : 0)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-white hover:bg-black/50"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* 썸네일 */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {product.images.map((img, idx) => (
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
          </div>

          {/* 상품 정보 */}
          <div>
            {/* 브랜드 & 카테고리 */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-primary-600 font-medium">{product.brand}</span>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-500">{product.category}</span>
            </div>

            {/* 상품명 */}
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              {product.title}
            </h1>

            {/* 평점 & 판매량 */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{product.rating.toFixed(1)}</span>
                <span className="text-gray-400">({formatPrice(reviewCount)} 리뷰)</span>
              </div>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">{formatPrice(soldCount)}+ 판매</span>
            </div>

            {/* 가격 */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold text-red-500">
                  {formatPrice(priceKrw)}
                </span>
                <span className="text-lg text-red-500">원</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 line-through">{formatPrice(originalPrice)}원</span>
                <span className="text-sm text-gray-500">(${product.price.toFixed(2)} USD)</span>
              </div>
            </div>

            {/* 배송 정보 */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm">
                <Truck className="w-5 h-5 text-green-500" />
                <span className="text-green-600 font-medium">무료배송</span>
                <span className="text-gray-400">30,000원 이상 구매 시</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-5 h-5 text-blue-500" />
                <span>예상 배송: 7-14일</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-5 h-5 text-purple-500" />
                <span>구매자 보호 프로그램 적용</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Package className="w-5 h-5 text-orange-500" />
                <span>재고: {product.stock}개</span>
              </div>
            </div>

            {/* 수량 선택 */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-gray-700 font-medium">수량</span>
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-gray-100"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-3 hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 구매 버튼 (데스크톱) */}
            <div className="hidden md:flex gap-3">
              <button
                onClick={handleAddToCart}
                className="flex-1 py-4 border-2 border-primary-500 text-primary-500 rounded-xl font-bold hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                장바구니
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 py-4 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition-colors"
              >
                바로 구매
              </button>
            </div>

            {/* 상품 설명 */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="font-bold text-lg mb-4">상품 설명</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden z-50">
        <div className="flex gap-3">
          <button
            onClick={handleAddToCart}
            className="w-14 h-14 border-2 border-primary-500 text-primary-500 rounded-xl flex items-center justify-center"
          >
            <ShoppingCart className="w-6 h-6" />
          </button>
          <button
            onClick={handleBuyNow}
            className="flex-1 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition-colors"
          >
            {formatPrice(priceKrw * quantity)}원 구매하기
          </button>
        </div>
      </div>
    </div>
  );
}
