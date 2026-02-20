'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Filter, ChevronDown, Grid2X2, Grid3X3, SlidersHorizontal } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { productsApi, categoriesApi, formatPrice, getBackendAvailable } from '@/lib/services';
import type { Product, Category } from '@/types';

type SortOption = 'latest' | 'price_low' | 'price_high' | 'popular';

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 필터 & 정렬
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [showFilters, setShowFilters] = useState(false);
  const [gridSize, setGridSize] = useState<2 | 3>(2);
  
  // 페이지네이션
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const categoriesData = await categoriesApi.getAll();
        const useBackend = await getBackendAvailable();
        let productsData: { items?: Product[]; total?: number } | null = null;
        if (useBackend) {
          productsData = await productsApi.getAll({ category: slug, page, limit: pageSize }).catch(() => null) as any;
        }
        if (productsData && productsData.items && productsData.items.length > 0) {
          setProducts(productsData.items);
          setTotalCount(productsData.total ?? 0);
          
          // 카테고리 정보 찾기
          const foundCategory = categoriesData.find(
            (c: Category) => c.slug === slug || c.name.toLowerCase() === slug.toLowerCase()
          );
          setCategory(foundCategory || { 
            id: 0, 
            name: decodeURIComponent(slug), 
            slug, 
            description: '' 
          });
        } else {
          // 폴백: DummyJSON (백엔드 미실행 또는 데이터 없음)
          const response = await fetch(
            `https://dummyjson.com/products/category/${slug}?limit=${pageSize}&skip=${(page - 1) * pageSize}`
          );
          
          if (!response.ok) throw new Error('Category not found');
          
          const data = await response.json();
          const exchangeRate = 1350;
          
          const transformedProducts: Product[] = data.products.map((item: any) => ({
            id: item.id,
            external_id: `dummy-${item.id}`,
            title: item.title,
            title_ko: item.title,
            description: item.description,
            description_ko: item.description,
            price_original: Math.round(item.price * exchangeRate / (1 - item.discountPercentage / 100)),
            price_final: Math.round(item.price * exchangeRate),
            currency: 'KRW',
            stock: item.stock,
            is_active: true,
            category: item.category,
            tags: [item.brand],
            main_image_url: item.thumbnail,
            images: item.images?.map((url: string, idx: number) => ({
              id: idx,
              product_id: item.id,
              url,
              is_main: idx === 0,
              sort_order: idx,
            })) || [],
            created_at: new Date().toISOString(),
          }));
          
          setProducts(transformedProducts);
          setTotalCount(data.total);
          setCategory({ 
            id: 0, 
            name: decodeURIComponent(slug).replace(/-/g, ' '), 
            slug, 
            description: '' 
          });
        }
      } catch (err) {
        setError('카테고리를 찾을 수 없습니다.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, page]);

  // 정렬 적용
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price_low':
        return a.price_final - b.price_final;
      case 'price_high':
        return b.price_final - a.price_final;
      case 'popular':
        return Math.random() - 0.5; // 임시: 실제로는 판매량 등으로 정렬
      default:
        return 0;
    }
  });

  // 가격 필터 적용
  const filteredProducts = sortedProducts.filter(
    p => p.price_final >= priceRange[0] && p.price_final <= priceRange[1]
  );

  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">상품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">🔍</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">카테고리를 찾을 수 없어요</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link href="/products" className="btn-primary">
            전체 상품 보기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/products" className="p-2 -ml-2">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <h1 className="flex-1 text-lg font-bold text-center capitalize">
              {category?.name || slug}
            </h1>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 -mr-2"
            >
              <SlidersHorizontal className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* 카테고리 배너 */}
      <div className="bg-gradient-to-r from-primary-500 to-orange-500 text-white py-6 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-1 capitalize">{category?.name}</h2>
          <p className="text-white/80">{totalCount}개의 상품</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {/* 필터 & 정렬 바 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm"
            >
              <Filter className="w-4 h-4" />
              필터
            </button>
            
            {/* 정렬 드롭다운 */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none px-3 py-2 pr-8 bg-white rounded-lg border border-gray-200 text-sm cursor-pointer"
              >
                <option value="latest">최신순</option>
                <option value="popular">인기순</option>
                <option value="price_low">낮은가격순</option>
                <option value="price_high">높은가격순</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* 그리드 사이즈 토글 */}
          <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setGridSize(2)}
              className={`p-1.5 rounded ${gridSize === 2 ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
            >
              <Grid2X2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGridSize(3)}
              className={`p-1.5 rounded ${gridSize === 3 ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 필터 패널 */}
        {showFilters && (
          <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
            <h3 className="font-bold mb-3">가격 범위</h3>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="최소"
                value={priceRange[0] || ''}
                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <span className="text-gray-400">~</span>
              <input
                type="number"
                placeholder="최대"
                value={priceRange[1] === 10000000 ? '' : priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 10000000])}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <button
                onClick={() => setPriceRange([0, 10000000])}
                className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600"
              >
                초기화
              </button>
            </div>

            {/* 빠른 가격 필터 */}
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                { label: '1만원 이하', range: [0, 10000] as [number, number] },
                { label: '1~3만원', range: [10000, 30000] as [number, number] },
                { label: '3~5만원', range: [30000, 50000] as [number, number] },
                { label: '5~10만원', range: [50000, 100000] as [number, number] },
                { label: '10만원 이상', range: [100000, 10000000] as [number, number] },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setPriceRange(opt.range)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    priceRange[0] === opt.range[0] && priceRange[1] === opt.range[1]
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 상품 목록 */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-6xl mb-4">🛍️</p>
            <h3 className="text-lg font-bold text-gray-800 mb-2">상품이 없어요</h3>
            <p className="text-gray-500">다른 필터를 선택해보세요.</p>
          </div>
        ) : (
          <div className={`grid gap-3 ${gridSize === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium ${
                      page === pageNum
                        ? 'bg-primary-500 text-white'
                        : 'bg-white border border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        )}

        {/* 결과 정보 */}
        <div className="text-center text-sm text-gray-500 mt-4">
          총 {formatPrice(totalCount)}개 중 {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)}개 표시
        </div>
      </div>
    </div>
  );
}
