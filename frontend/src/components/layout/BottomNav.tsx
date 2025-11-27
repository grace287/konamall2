'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, ShoppingCart, User } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

const navItems = [
  { href: '/', icon: Home, label: '홈' },
  { href: '/search', icon: Search, label: '검색' },
  { href: '/wishlist', icon: Heart, label: '찜' },
  { href: '/cart', icon: ShoppingCart, label: '장바구니', showBadge: true },
  { href: '/mypage', icon: User, label: '마이' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="bottom-nav safe-area-bottom">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="relative">
              <Icon className={`w-6 h-6 ${isActive ? 'text-primary-500' : ''}`} />
              {item.showBadge && cartCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-primary-500 text-white text-[10px] min-w-[16px] h-[16px] rounded-full flex items-center justify-center font-bold">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
            <span className={isActive ? 'text-primary-500 font-medium' : ''}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
