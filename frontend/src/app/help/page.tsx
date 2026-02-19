'use client';

import Link from 'next/link';
import { Phone, Mail, Clock, MessageCircle, ChevronRight } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 md:p-8">
        <h2 className="text-lg font-bold text-gray-800 mb-6">전화·채팅 안내</h2>
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
              <Phone className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">전화 문의</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">1588-0000</p>
              <p className="text-sm text-gray-500 mt-1">평일 09:00 ~ 18:00 (점심 12:00~13:00)</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">이메일 문의</p>
              <p className="text-lg font-medium text-gray-800 mt-1">help@konamall.com</p>
              <p className="text-sm text-gray-500 mt-1">24시간 접수 (답변 평일 기준)</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl mb-8">
          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-medium text-amber-800">고객센터 운영시간</p>
            <p className="text-sm text-amber-700 mt-0.5">
              평일 09:00 ~ 18:00 (토·일·공휴일 휴무) · 점심시간 12:00 ~ 13:00
            </p>
          </div>
        </div>

        <h2 className="text-lg font-bold text-gray-800 mb-4">바로가기</h2>
        <ul className="space-y-2">
          {[
            { href: '/help/faq', label: '자주 묻는 질문에서 찾기' },
            { href: '/help/notice', label: '공지사항 확인' },
            { href: '/help/shipping', label: '배송 일정·안내' },
            { href: '/help/returns', label: '반품·교환 신청 방법' },
            { href: '/help/contact', label: '1:1 문의하기' },
          ].map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 text-gray-700 group"
              >
                <span className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-gray-400" />
                  {label}
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
