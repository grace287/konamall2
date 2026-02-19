'use client';

import Link from 'next/link';

const notices = [
  { id: 1, title: 'KonaMall 서비스 오픈 안내', date: '2024-01-15', fixed: true },
  { id: 2, title: '설날 배송 일정 안내', date: '2024-01-20', fixed: false },
  { id: 3, title: '개인정보처리방침 개정 안내', date: '2024-01-10', fixed: false },
  { id: 4, title: '무료배송 기준 변경 안내 (30,000원)', date: '2024-01-05', fixed: false },
];

export default function NoticePage() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 md:p-8">
        <h2 className="text-lg font-bold text-gray-800 mb-6">공지사항</h2>
        <ul className="border-t border-gray-200">
          {notices.map((n) => (
            <li key={n.id} className="border-b border-gray-100 last:border-b-0">
              <Link
                href={`/help/notice/${n.id}`}
                className="flex items-center gap-3 px-2 py-4 hover:bg-gray-50 transition-colors"
              >
                {n.fixed && (
                  <span className="shrink-0 text-xs font-medium bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                    공지
                  </span>
                )}
                <span className="flex-1 text-gray-800 font-medium truncate">
                  {n.title}
                </span>
                <span className="shrink-0 text-sm text-gray-400">{n.date}</span>
              </Link>
            </li>
          ))}
        </ul>
        {notices.length === 0 && (
          <p className="text-center text-gray-500 py-12">등록된 공지가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
