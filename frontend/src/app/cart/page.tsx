'use client';

import { useCartStore } from '@/store/cartStore';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Trash2, Plus, Minus, ShoppingBag, Truck, 
  Shield, ChevronRight, Tag, Gift, CheckCircle2 
} from 'lucide-react';
import { useState } from 'react';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalKrw, clearCart } = useCartStore();
  const [selectedItems, setSelectedItems] = useState<number[]>(items.map(i => i.id));
  const [couponCode, setCouponCode] = useState('');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const selectedTotal = items
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.priceKrw * item.quantity, 0);

  const shippingFee = selectedTotal >= 30000 ? 0 : 3000;
  const discount = 0; // 쿠폰 할인
  const grandTotal = selectedTotal + shippingFee - discount;

  const toggleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(i => i.id));
    }
  };

  const toggleSelectItem = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 bg-gray-50">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-12 h-12 text-gray-300" />
        </div>
        <h1 className="text-xl font-bold mb-2 text-gray-800">장바구니가 비어있어요</h1>
        <p className="text-gray-500 mb-6 text-center">마음에 드는 상품을 담아보세요!</p>
        <Link
          href="/products"
          className="btn-primary flex items-center gap-2"
        >
          <ShoppingBag className="w-5 h-5" />
          쇼핑하러 가기
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-40 md:pb-8">
      {/* 상단 배너 */}
      <div className="bg-gradient-to-r from-primary-500 to-orange-500 text-white py-3 px-4">
        <div className="container mx-auto flex items-center justify-center gap-2 text-sm">
          <Gift className="w-4 h-4" />
          <span className="font-medium">30,000원 이상 구매 시 무료배송!</span>
          {selectedTotal < 30000 && (
            <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">
              {formatPrice(30000 - selectedTotal)}원 더 담으면 무료배송
            </span>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-primary-500" />
          장바구니
          <span className="text-primary-500">({items.length})</span>
        </h1>

        <div className="lg:flex lg:gap-6">
          {/* 장바구니 아이템 */}
          <div className="lg:flex-1">
            {/* 전체 선택 */}
            <div className="bg-white rounded-xl p-4 mb-4 flex items-center justify-between shadow-sm">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedItems.length === items.length}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="font-medium">전체선택 ({selectedItems.length}/{items.length})</span>
              </label>
              <button
                onClick={() => {
                  selectedItems.forEach(id => removeItem(id));
                  setSelectedItems([]);
                }}
                className="text-sm text-gray-500 hover:text-red-500"
              >
                선택삭제
              </button>
            </div>

            {/* 상품 목록 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-4 ${index !== items.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="flex gap-3">
                    {/* 체크박스 */}
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleSelectItem(item.id)}
                      className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500 mt-1"
                    />

                    {/* 이미지 */}
                    <div className="relative w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.nameKo || item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* 상품 정보 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 line-clamp-2 text-sm mb-1">
                        {item.nameKo || item.name}
                      </h3>
                      {item.variant && (
                        <p className="text-xs text-gray-500 mb-2">{item.variant}</p>
                      )}
                      
                      {/* 가격 */}
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-lg font-bold text-sale-600">
                          {formatPrice(item.priceKrw)}원
                        </span>
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(Math.round(item.priceKrw * 1.3))}원
                        </span>
                      </div>

                      {/* 수량 조절 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center bg-gray-100 rounded-full">
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="p-2 hover:bg-gray-200 rounded-l-full transition-colors"
                          >
                            <Minus className="w-4 h-4 text-gray-600" />
                          </button>
                          <span className="w-10 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 hover:bg-gray-200 rounded-r-full transition-colors"
                          >
                            <Plus className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 상품별 소계 */}
                  <div className="flex justify-end mt-3 pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-500">
                      소계: <span className="font-bold text-gray-800">{formatPrice(item.priceKrw * item.quantity)}원</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 전체 삭제 버튼 */}
            <button
              onClick={clearCart}
              className="mt-4 text-sm text-gray-500 hover:text-red-500 flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              장바구니 비우기
            </button>
          </div>

          {/* 주문 요약 - 데스크탑 */}
          <div className="hidden lg:block lg:w-96">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-32">
              <h2 className="text-lg font-bold mb-4">주문 요약</h2>

              {/* 쿠폰 입력 */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="쿠폰 코드 입력"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                    적용
                  </button>
                </div>
              </div>

              {/* 가격 정보 */}
              <div className="space-y-3 text-sm border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">상품 금액</span>
                  <span className="font-medium">{formatPrice(selectedTotal)}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">배송비</span>
                  <span className={`font-medium ${shippingFee === 0 ? 'text-green-600' : ''}`}>
                    {shippingFee === 0 ? '무료' : `${formatPrice(shippingFee)}원`}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>쿠폰 할인</span>
                    <span>-{formatPrice(discount)}원</span>
                  </div>
                )}
              </div>

              {/* 무료배송 프로그레스 */}
              {selectedTotal < 30000 && (
                <div className="mt-4 p-3 bg-primary-50 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-primary-700 mb-2">
                    <Truck className="w-4 h-4" />
                    <span>{formatPrice(30000 - selectedTotal)}원 더 담으면 무료배송!</span>
                  </div>
                  <div className="w-full bg-primary-100 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (selectedTotal / 30000) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 총액 */}
              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">총 결제금액</span>
                  <span className="text-2xl font-bold text-primary-600">{formatPrice(grandTotal)}원</span>
                </div>
              </div>

              {/* 결제 버튼 */}
              <Link
                href="/checkout"
                className="block w-full bg-primary-500 hover:bg-primary-600 text-white text-center py-4 rounded-xl mt-6 font-bold text-lg transition-colors"
              >
                결제하기
              </Link>

              {/* 신뢰 배지 */}
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  <span>안전결제</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>정품보장</span>
                </div>
              </div>

              <Link
                href="/products"
                className="block w-full text-center py-3 mt-3 text-gray-600 hover:text-primary-600 text-sm"
              >
                쇼핑 계속하기 →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 하단 결제 바 */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t shadow-lg p-4 lg:hidden z-30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-600 text-sm">총 {selectedItems.length}개 상품</span>
          <div className="text-right">
            <span className="text-xl font-bold text-primary-600">{formatPrice(grandTotal)}원</span>
            {shippingFee === 0 && (
              <span className="block text-xs text-green-600">무료배송</span>
            )}
          </div>
        </div>
        <Link
          href="/checkout"
          className="block w-full bg-primary-500 text-white text-center py-4 rounded-xl font-bold text-lg"
        >
          {formatPrice(grandTotal)}원 결제하기
        </Link>
      </div>
    </div>
  );
}
