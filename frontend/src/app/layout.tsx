import './globals.css';
import type { Metadata } from 'next';

import { Toaster } from 'react-hot-toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'), // ⭐ 경고 제거 핵심
  title: 'KonaMall - 글로벌 직구 쇼핑몰',
  description: '해외 직구 상품을 쉽고 빠르게, KonaMall에서 만나보세요',
  keywords: 'Temu, AliExpress, Amazon, 직구, 해외쇼핑, 글로벌쇼핑',
  openGraph: {
    title: 'KonaMall - 글로벌 직구 쇼핑몰',
    description: '해외 직구 상품을 쉽고 빠르게!',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 2000,
            className: 'custom-toast',
          }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
