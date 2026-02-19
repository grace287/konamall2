'use client';

import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { productsApi, formatPrice, getBackendAvailable } from '@/lib/services';
import type { Product } from '@/types';

interface ProductGridProps {
  limit?: number;
  category?: string;
  search?: string;
  columns?: 2 | 3 | 4;
}

// DummyJSON 폴백용 타입
interface DummyProduct {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  category: string;
  thumbnail: string;
  images: string[];
}

// DummyJSON → 우리 타입으로 변환
const transformDummyProduct = (product: DummyProduct): Product => {
  const exchangeRate = 1350;
  const priceKrw = Math.round(product.price * exchangeRate);
  const originalPriceKrw = Math.round(priceKrw / (1 - product.discountPercentage / 100));
  
  return {
    id: product.id,
    external_id: `dummy-${product.id}`,
    title: product.title,
    title_ko: product.title,
    description: product.description,
    description_ko: product.description,
    price_original: originalPriceKrw,
    price_final: priceKrw,
    currency: 'KRW',
    stock: product.stock,
    is_active: true,
    category: product.category,
    tags: [product.brand],
    shipping_days_min: 7,
    shipping_days_max: 14,
    images: product.images.map((url, idx) => ({
      id: idx,
      product_id: product.id,
      url,
      is_main: idx === 0,
      sort_order: idx,
    })),
    created_at: new Date().toISOString(),
  };
};

export default function ProductGrid({ limit = 8, category, search, columns = 4 }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      const useBackend = await getBackendAvailable();
      if (useBackend) {
        try {
          const response = await productsApi.getProducts({
            limit,
            category: category !== 'all' ? category : undefined,
            search,
          });
          if (response.items && response.items.length > 0) {
            setProducts(response.items);
            setLoading(false);
            return;
          }
        } catch (_) {
          // 백엔드 사용 불가로 전환 후 폴백으로 진행
        }
      }

      // 폴백: DummyJSON API 사용 (백엔드 미실행 또는 응답 없음)
      try {
        let url = `https://dummyjson.com/products?limit=${limit}`;
        
        // 카테고리 매핑
        if (category && category !== 'all') {
          const categoryMap: Record<string, string> = {
            'electronics': 'smartphones',
            'fashion': 'tops',
            'home': 'home-decoration',
            'beauty': 'skincare',
            'sports': 'mens-shoes',
            'automotive': 'automotive',
          };
          const mappedCategory = categoryMap[category] || category;
          url = `https://dummyjson.com/products/category/${mappedCategory}?limit=${limit}`;
        }
        
        if (search) {
          url = `https://dummyjson.com/products/search?q=${encodeURIComponent(search)}&limit=${limit}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        const transformedProducts = data.products.map(transformDummyProduct);
        setProducts(transformedProducts);
      } catch (fallbackError) {
        console.error('DummyJSON 폴백도 실패:', fallbackError);
        setError('상품을 불러오는데 실패했습니다.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [limit, category, search]);

  const gridColsClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }[columns];

  if (loading) {
    return (
      <div className={`grid ${gridColsClass} gap-3 md:gap-4`}>
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="aspect-square shimmer" />
            <div className="p-3 space-y-2">
              <div className="h-4 shimmer rounded w-full" />
              <div className="h-4 shimmer rounded w-2/3" />
              <div className="h-6 shimmer rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-xl">
        <div className="text-5xl mb-4">😢</div>
        <p className="text-gray-500 text-lg">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-full hover:bg-primary-600"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-xl">
        <div className="text-5xl mb-4">🔍</div>
        <p className="text-gray-500 text-lg">상품이 없습니다</p>
        <p className="text-gray-400 text-sm mt-1">다른 검색어로 시도해보세요</p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridColsClass} gap-3 md:gap-4`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
