'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

const notices: Record<string, { title: string; date: string; body: string }> = {
  '1': {
    title: 'KonaMall 서비스 오픈 안내',
    date: '2024-01-15',
    body: 'KonaMall이 정식 오픈했습니다. 해외 직구 상품을 원화로 편리하게 구매하실 수 있습니다. 많은 이용 부탁 드립니다.',
  },
  '2': {
    title: '설날 배송 일정 안내',
    date: '2024-01-20',
    body: '설 연휴 기간 택배 배송이 지연될 수 있습니다. 연휴 전 주문 건은 최대한 빠르게 발송해 드리겠습니다.',
  },
  '3': {
    title: '개인정보처리방침 개정 안내',
    date: '2024-01-10',
    body: '개인정보처리방침이 일부 개정되었습니다. 변경 내용은 정책 페이지에서 확인해 주세요.',
  },
  '4': {
    title: '무료배송 기준 변경 안내 (30,000원)',
    date: '2024-01-05',
    body: '무료배송 적용 기준이 30,000원 이상으로 변경되었습니다. 30,000원 미만 주문 시 배송비 3,000원이 부과됩니다.',
  },
};

export default function NoticeDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const notice = id ? notices[id] : null;

  if (!notice) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">공지를 찾을 수 없습니다.</p>
        <Link href="/help/notice" className="mt-4 inline-block text-primary-600 text-sm hover:underline">
          목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-lg font-bold text-gray-800">{notice.title}</h2>
          <p className="text-sm text-gray-500 mt-1">{notice.date}</p>
        </div>
        <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-line">
          {notice.body}
        </div>
        <div className="mt-8 pt-6 border-t border-gray-100">
          <Link href="/help/notice" className="text-primary-600 text-sm hover:underline">
            ← 공지사항 목록
          </Link>
        </div>
      </div>
    </div>
  );
}
