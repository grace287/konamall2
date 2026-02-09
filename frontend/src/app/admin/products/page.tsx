'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Package, ExternalLink } from 'lucide-react';

interface ProductRow {
  id: number;
  title: string;
  title_ko?: string;
  category?: string;
  price_final?: number;
  price_original?: number;
  stock: number;
  is_active: boolean;
  created_at?: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api
      .get('/api/admin/products', { params: { page, limit: 20 } })
      .then((res) => setProducts(res.data))
      .catch((err) => setError(err.response?.data?.detail || '상품 목록을 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  }, [page]);

  const formatPrice = (n: number | undefined) =>
    n != null ? new Intl.NumberFormat('ko-KR').format(n) + '원' : '-';

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Package className="w-7 h-7 text-primary-500" />
        상품 관리
      </h1>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">불러오는 중...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            등록된 상품이 없습니다. 공급처 연동 또는 상품 등록을 진행해주세요.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">ID</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">상품명</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">카테고리</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">판매가</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">재고</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">상태</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">보기</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{p.id}</td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">
                      {p.title_ko || p.title || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">{p.category ?? '-'}</td>
                    <td className="px-4 py-3 text-sm">{formatPrice(p.price_final)}</td>
                    <td className="px-4 py-3 text-sm">{p.stock ?? 0}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {p.is_active ? '판매중' : '비활성'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/products/${p.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline inline-flex items-center gap-1 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        상세
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {products.length > 0 && (
          <div className="px-4 py-3 border-t flex justify-between items-center">
            <button
              onClick={() => setPage((x) => Math.max(1, x - 1))}
              disabled={page <= 1}
              className="text-sm text-primary-600 disabled:opacity-50"
            >
              이전
            </button>
            <span className="text-sm text-gray-500">페이지 {page}</span>
            <button
              onClick={() => setPage((x) => x + 1)}
              disabled={products.length < 20}
              className="text-sm text-primary-600 disabled:opacity-50"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
