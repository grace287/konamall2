'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { categoriesApi } from '@/lib/services';
import type { Category } from '@/types';

// 기본 카테고리 (API 실패 시 폴백)
const defaultCategories = [
  { id: 'smartphones', name: '스마트폰', icon: '📱', color: 'bg-blue-100', slug: 'smartphones' },
  { id: 'laptops', name: '노트북', icon: '💻', color: 'bg-gray-100', slug: 'laptops' },
  { id: 'fragrances', name: '향수', icon: '🌸', color: 'bg-pink-100', slug: 'fragrances' },
  { id: 'skincare', name: '스킨케어', icon: '✨', color: 'bg-purple-100', slug: 'skincare' },
  { id: 'groceries', name: '식료품', icon: '🥗', color: 'bg-green-100', slug: 'groceries' },
  { id: 'home-decoration', name: '홈데코', icon: '🏠', color: 'bg-yellow-100', slug: 'home-decoration' },
  { id: 'furniture', name: '가구', icon: '🪑', color: 'bg-orange-100', slug: 'furniture' },
  { id: 'tops', name: '상의', icon: '👕', color: 'bg-indigo-100', slug: 'tops' },
  { id: 'womens-dresses', name: '원피스', icon: '👗', color: 'bg-rose-100', slug: 'womens-dresses' },
  { id: 'womens-shoes', name: '여성화', icon: '👠', color: 'bg-red-100', slug: 'womens-shoes' },
  { id: 'mens-shirts', name: '남성셔츠', icon: '👔', color: 'bg-sky-100', slug: 'mens-shirts' },
  { id: 'mens-shoes', name: '남성화', icon: '👟', color: 'bg-amber-100', slug: 'mens-shoes' },
];

// 카테고리 아이콘 매핑
const categoryIcons: Record<string, { icon: string; color: string }> = {
  'smartphones': { icon: '📱', color: 'bg-blue-100' },
  'laptops': { icon: '💻', color: 'bg-gray-100' },
  'fragrances': { icon: '🌸', color: 'bg-pink-100' },
  'skincare': { icon: '✨', color: 'bg-purple-100' },
  'groceries': { icon: '🥗', color: 'bg-green-100' },
  'home-decoration': { icon: '🏠', color: 'bg-yellow-100' },
  'furniture': { icon: '🪑', color: 'bg-orange-100' },
  'tops': { icon: '👕', color: 'bg-indigo-100' },
  'womens-dresses': { icon: '👗', color: 'bg-rose-100' },
  'womens-shoes': { icon: '👠', color: 'bg-red-100' },
  'mens-shirts': { icon: '👔', color: 'bg-sky-100' },
  'mens-shoes': { icon: '👟', color: 'bg-amber-100' },
  'mens-watches': { icon: '⌚', color: 'bg-slate-100' },
  'womens-watches': { icon: '⌚', color: 'bg-violet-100' },
  'womens-bags': { icon: '👜', color: 'bg-fuchsia-100' },
  'womens-jewellery': { icon: '💎', color: 'bg-cyan-100' },
  'sunglasses': { icon: '🕶️', color: 'bg-amber-100' },
  'automotive': { icon: '🚗', color: 'bg-slate-100' },
  'motorcycle': { icon: '🏍️', color: 'bg-zinc-100' },
  'lighting': { icon: '💡', color: 'bg-yellow-100' },
  // 기본값
  'default': { icon: '🛍️', color: 'bg-gray-100' },
};

export default function CategorySlider() {
  const [categories, setCategories] = useState(defaultCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // 먼저 실제 API 시도
        const apiCategories = await categoriesApi.getAll();
        if (apiCategories && apiCategories.length > 0) {
          const mapped = apiCategories.slice(0, 12).map((cat: Category) => {
            const iconData = categoryIcons[cat.slug] || categoryIcons['default'];
            return {
              id: cat.slug || cat.id.toString(),
              name: cat.name,
              icon: iconData.icon,
              color: iconData.color,
              slug: cat.slug,
            };
          });
          setCategories(mapped);
        }
      } catch (error) {
        // 폴백: DummyJSON 카테고리
        try {
          const response = await fetch('https://dummyjson.com/products/categories');
          const data = await response.json();
          
          if (Array.isArray(data)) {
            const mapped = data.slice(0, 12).map((cat: any) => {
              const slug = typeof cat === 'string' ? cat : cat.slug;
              const name = typeof cat === 'string' ? cat : cat.name;
              const iconData = categoryIcons[slug] || categoryIcons['default'];
              return {
                id: slug,
                name: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' '),
                icon: iconData.icon,
                color: iconData.color,
                slug: slug,
              };
            });
            setCategories(mapped);
          }
        } catch (fallbackError) {
          console.error('카테고리 로드 실패:', fallbackError);
          // 기본값 유지
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <section className="bg-white py-6 md:py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <span>🏷️</span>
            인기 카테고리
          </h2>
          <div className="w-12 h-1 bg-primary-500 mx-auto mt-2 rounded-full" />
        </div>

        {loading ? (
          <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-2 justify-start md:justify-center">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 min-w-[70px]">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-200 rounded-2xl animate-pulse" />
                <div className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-2 justify-start md:justify-center">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products/category/${cat.slug}`}
                className="flex flex-col items-center gap-2 min-w-[70px] group"
              >
                <div
                  className={`w-14 h-14 md:w-16 md:h-16 ${cat.color} rounded-2xl flex items-center justify-center text-2xl md:text-3xl shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-200`}
                >
                  {cat.icon}
                </div>
                <span className="text-xs md:text-sm font-medium text-gray-600 group-hover:text-primary-600 whitespace-nowrap text-center max-w-[70px] truncate">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* 전체 카테고리 보기 */}
        <div className="text-center mt-4">
          <Link 
            href="/products" 
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            전체 카테고리 보기 →
          </Link>
        </div>
      </div>
    </section>
  );
}
