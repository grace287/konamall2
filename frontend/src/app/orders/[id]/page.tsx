'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ordersApi, formatPrice } from '@/lib/services';
import { CheckCircle2, Package, Home, List } from 'lucide-react';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = Number(params.id);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    ordersApi
      .getOrder(orderId)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-gray-500 mb-4">주문을 찾을 수 없습니다.</p>
        <Link href="/" className="text-primary-600 font-medium">
          홈으로
        </Link>
      </div>
    );
  }

  const isPaid = order.payment_status === 'completed' || order.paid_at;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-lg">
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">주문이 완료되었습니다</h1>
          <p className="text-gray-500 text-sm mb-4">주문번호: {order.order_number}</p>
          <p className="text-2xl font-bold text-primary-600">{formatPrice(order.total_amount)}원</p>
          {isPaid && (
            <p className="text-green-600 text-sm mt-2">결제 완료</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <Package className="w-5 h-5" />
            주문 상품
          </h2>
          <ul className="space-y-2">
            {(order.items || []).map((item: any) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span className="truncate flex-1">{item.product_title} x {item.quantity}</span>
                <span>{formatPrice((item.unit_price || 0) * item.quantity)}원</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-3">
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-primary-500 text-primary-600 font-medium rounded-xl"
          >
            <Home className="w-5 h-5" />
            홈으로
          </Link>
          <Link
            href="/products"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-500 text-white font-medium rounded-xl"
          >
            <List className="w-5 h-5" />
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    </div>
  );
}
