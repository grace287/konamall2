'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { getBackendAvailable } from '@/lib/services';
import { AxiosError } from 'axios';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Package,
  LogOut,
  ExternalLink,
  Menu,
  X,
  AlertCircle,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [backendDown, setBackendDown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const backendOk = await getBackendAvailable();
      if (!mounted) return;
      if (!backendOk) {
        setBackendDown(true);
        setChecking(false);
        return;
      }
      try {
        const res = await api.get('/api/users/me');
        if (mounted && res.data?.role === 'admin') setAllowed(true);
        else if (mounted) router.replace('/');
      } catch (err) {
        if (!mounted) return;
        const isNetworkError = err instanceof AxiosError && !err.response;
        if (isNetworkError) {
          setBackendDown(true);
        } else {
          router.replace('/login?redirect=/admin');
        }
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin w-10 h-10 border-2 border-slate-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (backendDown) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-amber-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">서버에 연결할 수 없습니다</h2>
          <p className="text-gray-600 text-sm mb-6">
            관리자 페이지는 백엔드 서버가 실행 중일 때만 이용할 수 있습니다.
            <br />
            백엔드를 실행한 뒤 새로고침해 주세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700"
            >
              <ExternalLink className="w-4 h-4" />
              쇼핑몰로 이동
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              새로고침
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!allowed) return null;

  const nav = [
    { href: '/admin', label: '대시보드', icon: LayoutDashboard },
    { href: '/admin/users', label: '회원 관리', icon: Users },
    { href: '/admin/orders', label: '주문 관리', icon: ShoppingBag },
    { href: '/admin/products', label: '상품 관리', icon: Package },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* 사이드바 - 데스크톱 */}
      <aside className="hidden md:flex md:flex-col w-60 bg-slate-800 text-white shrink-0">
        <div className="p-4 border-b border-slate-700">
          <span className="font-bold text-lg text-white">KonaMall</span>
          <span className="block text-xs text-slate-400 mt-0.5">관리자</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === href
                  ? 'bg-slate-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700 space-y-1">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <ExternalLink className="w-5 h-5" />
            쇼핑몰 열기
          </a>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('konamall-auth');
                window.location.href = '/';
              }
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* 모바일: 상단 헤더 + 햄버거 */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-slate-800 text-white px-4 py-3 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-2"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <span className="font-bold">KonaMall 관리자</span>
          <span className="w-10" />
        </header>

        {/* 모바일 사이드바 오버레이 */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}
        <aside
          className={`md:hidden fixed top-0 left-0 z-50 h-full w-60 bg-slate-800 text-white transform transition-transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-slate-700">
            <span className="font-bold text-lg">KonaMall 관리자</span>
          </div>
          <nav className="p-3 space-y-1">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                  pathname === href ? 'bg-slate-600' : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="p-3 border-t border-slate-700">
            <a
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-700"
            >
              <ExternalLink className="w-5 h-5" />
              쇼핑몰 열기
            </a>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('konamall-auth');
                window.location.href = '/';
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-700 text-left"
            >
              <LogOut className="w-5 h-5" />
              로그아웃
            </button>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
