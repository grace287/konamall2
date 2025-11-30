import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function PromoBanner() {
  return (
    <section className="py-6 md:py-8">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl md:rounded-3xl overflow-hidden">
          <div className="px-6 py-8 md:px-12 md:py-12 text-center text-white">
            {/* 배지 */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">새로운 회원 전용</span>
            </div>

            {/* 타이틀 */}
            <h2 className="text-2xl md:text-4xl font-bold mb-3">
              첫 구매 시 30% 할인받기!
            </h2>

            {/* 설명 */}
            <p className="text-white/80 mb-6 text-sm md:text-base">
              가입 후 첫 주문에서 최대 30% 할인을 받을 수 있습니다.
            </p>

            {/* CTA 버튼 */}
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-white text-purple-600 font-bold px-8 py-3 rounded-full hover:bg-gray-100 transition-all hover:scale-105 shadow-lg"
            >
              지금 쇼핑하기
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
