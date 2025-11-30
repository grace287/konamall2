import { Truck, Award, Shield } from 'lucide-react';

const features = [
  {
    icon: Truck,
    emoji: '🚚',
    title: '빠른 배송',
    description: '전국 3~5일 배송, 무료 배송 이벤트 진행 중',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    icon: Award,
    emoji: '💯',
    title: '100% 정품보증',
    description: '모든 상품은 정품만 판매합니다. 위조품 적발 시 무료 반품',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  {
    icon: Shield,
    emoji: '🛡️',
    title: '안전한 결제',
    description: '다양한 결제 수단 지원, 개인정보 암호화 보호',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
];

export default function TrustBadges() {
  return (
    <section className="bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-4xl md:text-5xl mb-4">{feature.emoji}</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
