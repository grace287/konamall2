'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Send } from 'lucide-react';

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 md:p-8">
        <h2 className="text-lg font-bold text-gray-800 mb-6">1:1 문의</h2>

        <div className="mb-8 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-600">
            전화 문의: <strong>1588-0000</strong> (평일 09:00~18:00)
            <br />
            이메일: <strong>help@konamall.com</strong> (24시간 접수)
          </p>
        </div>

        {sent ? (
          <div className="text-center py-12">
            <p className="text-primary-600 font-medium mb-2">문의가 접수되었습니다.</p>
            <p className="text-sm text-gray-500 mb-4">
              평일 기준 1~2일 내 답변 드리겠습니다.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-primary-600 text-sm hover:underline"
            >
              추가 문의하기
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                문의 유형
              </label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                required
              >
                <option value="">선택해 주세요</option>
                <option value="order">주문/결제</option>
                <option value="shipping">배송</option>
                <option value="return">반품/교환</option>
                <option value="product">상품 문의</option>
                <option value="etc">기타</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제목
              </label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                placeholder="문의 제목을 입력해 주세요"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                내용
              </label>
              <textarea
                rows={5}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none"
                placeholder="문의 내용을 자세히 적어 주시면 빠르게 답변 드리겠습니다."
                required
              />
            </div>
            <p className="text-xs text-gray-500">
              로그인 후 문의하시면 주문 정보와 함께 더 정확한 답변이 가능합니다.
            </p>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600"
            >
              <Send className="w-5 h-5" />
              문의하기
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
