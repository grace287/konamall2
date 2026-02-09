'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface OrderRow {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  items_count: number;
  created_at: string | null;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api
      .get('/api/admin/orders', { params: { page, limit: 20 } })
      .then((res) => setOrders(res.data))
      .catch((err) => setError(err.response?.data?.detail || '주문 목록을 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  }, [page]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  const formatDate = (s: string | null) =>
    s ? new Date(s).toLocaleString('ko-KR') : '-';
  const formatPrice = (n: number) => new Intl.NumberFormat('ko-KR').format(n) + '원';

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">주문 목록</h1>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">불러오는 중...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">주문이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">주문번호</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">상태</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">결제</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">금액</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">품목 수</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">주문일시</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{o.order_number}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${o.payment_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {o.payment_status === 'completed' ? '결제완료' : '대기'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{formatPrice(o.total_amount)}</td>
                    <td className="px-4 py-3 text-sm">{o.items_count}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 py-3 border-t flex justify-between items-center">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-sm text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>
          <span className="text-sm text-gray-500">페이지 {page}</span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={orders.length < 20}
            className="text-sm text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
