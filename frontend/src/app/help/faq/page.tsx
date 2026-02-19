'use client';

import { useState } from 'react';

const faqs = [
  {
    q: '주문은 어떻게 취소하나요?',
    a: '마이페이지 > 주문내역에서 해당 주문의 [취소] 버튼을 눌러 주세요. 결제 완료 전에는 직접 취소 가능하며, 결제 완료 후에는 1:1 문의를 이용해 주시면 됩니다.',
  },
  {
    q: '배송은 며칠 걸리나요?',
    a: '해외 직구 상품은 결제 완료 후 7~21일 정도 소요됩니다. 상품별 상세페이지에 예상 배송일이 안내되어 있습니다.',
  },
  {
    q: '반품/교환은 어떻게 신청하나요?',
    a: '수령일로부터 7일 이내, 미개봉·미사용 상태인 경우 고객센터(1588-0000) 또는 1:1 문의로 신청해 주세요. 왕복 배송비는 고객 부담입니다.',
  },
  {
    q: '결제 수단은 어떤 것이 있나요?',
    a: '카드, 카카오페이, 네이버페이 등으로 결제하실 수 있습니다. 결제 화면에서 선택해 주세요.',
  },
  {
    q: '회원가입 시 어떤 혜택이 있나요?',
    a: '신규 가입 시 할인 쿠폰이 지급되며, 30,000원 이상 구매 시 무료배송 혜택을 받으실 수 있습니다.',
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 md:p-8">
        <h2 className="text-lg font-bold text-gray-800 mb-6">자주 묻는 질문</h2>
        <ul className="space-y-2">
          {faqs.map((item, i) => (
            <li
              key={i}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left font-medium text-gray-800 hover:bg-gray-50"
              >
                <span className="flex-1">Q. {item.q}</span>
                <span
                  className={`shrink-0 text-gray-400 transition-transform ${
                    openIndex === i ? 'rotate-180' : ''
                  }`}
                >
                  ▼
                </span>
              </button>
              {openIndex === i && (
                <div className="px-4 pb-4 pt-0">
                  <p className="text-gray-600 text-sm leading-relaxed pl-4 border-l-2 border-primary-200">
                    {item.a}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
