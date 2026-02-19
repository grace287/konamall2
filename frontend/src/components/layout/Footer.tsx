import Link from 'next/link';
import { 
  Mail, Phone, MapPin, 
  Facebook, Instagram, Youtube, Twitter 
} from 'lucide-react';

const paymentMethods = ['visa', 'mastercard', 'kakaopay', 'naverpay', 'toss'];
const categories = [
  { name: '전체 상품', href: '/products' },
  { name: '전자기기', href: '/products?category=electronics' },
  { name: '패션/의류', href: '/products?category=fashion' },
  { name: '홈/리빙', href: '/products?category=home' },
  { name: '뷰티', href: '/products?category=beauty' },
  { name: '스포츠', href: '/products?category=sports' },
];

export default function Footer() {
  return (
    <footer className="bg-dark-900 text-gray-400 pt-12 pb-24 md:pb-12">
      <div className="container mx-auto px-4">
        {/* 상단 구분선과 배너 */}
        <div className="grid md:grid-cols-3 gap-6 mb-10 pb-10 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
              <span className="text-2xl">🚚</span>
            </div>
            <div>
              <h4 className="text-white font-medium">무료배송</h4>
              <p className="text-sm">30,000원 이상 무료배송</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
              <span className="text-2xl">🔒</span>
            </div>
            <div>
              <h4 className="text-white font-medium">안전결제</h4>
              <p className="text-sm">100% 안전 결제 보장</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
              <span className="text-2xl">💬</span>
            </div>
            <div>
              <h4 className="text-white font-medium">고객지원</h4>
              <p className="text-sm">평일 09:00 - 18:00</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-8">
          {/* 브랜드 & 연락처 */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-orange-400 bg-clip-text text-transparent">
                KonaMall
              </span>
            </Link>
            <p className="text-sm mb-6 max-w-xs">
              전 세계 인기 상품을 원화로 쉽고 빠르게!
              <br />Temu, AliExpress, Amazon 상품을 한곳에서.
            </p>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary-400" />
                <span>1588-0000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary-400" />
                <span>help@konamall.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-400" />
                <span>서울특별시 강남구 테헤란로 123</span>
              </div>
            </div>

            {/* 소셜 링크 */}
            <div className="flex gap-3 mt-6">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 hover:bg-primary-500 flex items-center justify-center transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 hover:bg-primary-500 flex items-center justify-center transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 hover:bg-primary-500 flex items-center justify-center transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 hover:bg-primary-500 flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* 카테고리 */}
          <div>
            <h4 className="text-white font-semibold mb-4">카테고리</h4>
            <ul className="space-y-2 text-sm">
              {categories.map((cat) => (
                <li key={cat.name}>
                  <Link href={cat.href} className="hover:text-primary-400 transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 고객지원 */}
          <div>
            <h4 className="text-white font-semibold mb-4">고객지원</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/help" className="hover:text-primary-400 transition-colors">고객센터</Link></li>
              <li><Link href="/help/faq" className="hover:text-primary-400 transition-colors">자주 묻는 질문</Link></li>
              <li><Link href="/help/notice" className="hover:text-primary-400 transition-colors">공지사항</Link></li>
              <li><Link href="/help/shipping" className="hover:text-primary-400 transition-colors">배송 안내</Link></li>
              <li><Link href="/help/returns" className="hover:text-primary-400 transition-colors">반품/교환</Link></li>
              <li><Link href="/help/contact" className="hover:text-primary-400 transition-colors">1:1 문의</Link></li>
            </ul>
          </div>

          {/* 정책 */}
          <div>
            <h4 className="text-white font-semibold mb-4">정책</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/policy/terms" className="hover:text-primary-400 transition-colors">이용약관</Link></li>
              <li><Link href="/policy/privacy" className="hover:text-primary-400 transition-colors">개인정보처리방침</Link></li>
              <li><Link href="/policy/refund" className="hover:text-primary-400 transition-colors">환불정책</Link></li>
              <li><Link href="/seller" className="hover:text-primary-400 transition-colors">입점문의</Link></li>
            </ul>
          </div>
        </div>

        {/* 결제수단 & 인증 */}
        <div className="border-t border-gray-800 mt-10 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">결제수단</span>
              <div className="flex gap-2">
                {['💳', '🏦', '📱', '💛', '💚'].map((icon, i) => (
                  <span 
                    key={i}
                    className="w-10 h-6 bg-gray-800 rounded flex items-center justify-center text-sm"
                  >
                    {icon}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>🔒 SSL 보안인증</span>
              <span>|</span>
              <span>✅ PG사 인증</span>
              <span>|</span>
              <span>🛡️ 구매안전서비스</span>
            </div>
          </div>
        </div>

        {/* 카피라이트 & 사업자 정보 */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-xs text-gray-500">
          <div className="text-center md:text-left space-y-2">
            <p>
              (주)코나몰 | 대표: 홍길동 | 사업자등록번호: 123-45-67890 | 
              통신판매업신고: 제2024-서울강남-0001호
            </p>
            <p>
              주소: 서울특별시 강남구 테헤란로 123, 456호 | 
              개인정보보호책임자: 김보안 | 호스팅서비스: AWS
            </p>
            <p className="pt-2">
              © {new Date().getFullYear()} KonaMall. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
