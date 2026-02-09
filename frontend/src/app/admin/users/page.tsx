'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface UserRow {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api
      .get('/api/admin/users', { params: { page, limit: 20 } })
      .then((res) => setUsers(res.data))
      .catch((err) => setError(err.response?.data?.detail || '회원 목록을 불러올 수 없습니다.'))
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">회원 목록</h1>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">불러오는 중...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">등록된 회원이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">ID</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">이메일</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">이름</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">역할</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">상태</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">가입일</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{u.id}</td>
                    <td className="px-4 py-3 text-sm">{u.email}</td>
                    <td className="px-4 py-3 text-sm">{u.name ?? '-'}</td>
                    <td className="px-4 py-3 text-sm">{u.role}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.is_active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(u.created_at)}</td>
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
            disabled={users.length < 20}
            className="text-sm text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
