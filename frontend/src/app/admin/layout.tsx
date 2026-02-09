'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { LayoutDashboard, Users, ShoppingBag } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;
    api
      .get('/api/users/me')
      .then((res) => {
        if (mounted && res.data?.role === 'admin') setAllowed(true);
        else if (mounted) router.replace('/');
      })
      .catch(() => {
        if (mounted) router.replace('/login');
      })
      .finally(() => {
        if (mounted) setChecking(false);
      });
    return () => { mounted = false; };
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!allowed) return null;

  const nav = [
    { href: '/admin', label: '대시보드', icon: LayoutDashboard },
    { href: '/admin/users', label: '회원 목록', icon: Users },
    { href: '/admin/orders', label: '주문 목록', icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/admin" className="font-bold text-lg text-gray-800">
            KonaMall 관리자
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-primary-600">
            쇼핑몰로 돌아가기
          </Link>
        </div>
        <nav className="container mx-auto px-4 flex gap-1 border-t">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                pathname === href
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
