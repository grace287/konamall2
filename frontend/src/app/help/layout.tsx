'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Headphones,
  MessageCircleQuestion,
  Truck,
  RefreshCw,
  Mail,
  FileText,
  ChevronRight,
} from 'lucide-react';

const menus = [
  { href: '/help', label: '고객센터 홈', icon: Headphones },
  { href: '/help/notice', label: '공지사항', icon: FileText },
  { href: '/help/faq', label: '자주 묻는 질문', icon: MessageCircleQuestion },
  { href: '/help/shipping', label: '배송 안내', icon: Truck },
  { href: '/help/returns', label: '반품/교환', icon: RefreshCw },
  { href: '/help/contact', label: '1:1 문의', icon: Mail },
];

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Headphones className="w-7 h-7 text-primary-500" />
            고객센터
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            궁금한 점이 있으시면 안내를 확인해 주세요.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <nav className="md:w-56 shrink-0">
            <ul className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {menus.map(({ href, label, icon: Icon }) => {
                const isActive =
                  href === '/help'
                    ? pathname === '/help'
                    : pathname?.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center justify-between gap-2 px-4 py-3.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-gray-400 shrink-0" />
                        {label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex-1 min-w-0">
            {children}
            <p className="mt-6 text-center text-xs text-gray-400">
              관리자 페이지는{' '}
              <a href="/admin" className="text-gray-500 hover:underline">/admin</a>
              {' '}에서 로그인(admin 계정) 후 이용할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
