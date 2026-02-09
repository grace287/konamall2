'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Users, ShoppingBag, CreditCard } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<{ users_total?: number; orders_total?: number; orders_paid?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/api/admin/stats')
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.response?.data?.detail || '통계를 불러올 수 없습니다.'));
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  const cards = [
    { label: '전체 회원', value: stats?.users_total ?? '-', icon: Users, color: 'bg-blue-500' },
    { label: '전체 주문', value: stats?.orders_total ?? '-', icon: ShoppingBag, color: 'bg-green-500' },
    { label: '결제 완료 주문', value: stats?.orders_paid ?? '-', icon: CreditCard, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">대시보드</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
            <div className={`${color} text-white p-3 rounded-lg`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
