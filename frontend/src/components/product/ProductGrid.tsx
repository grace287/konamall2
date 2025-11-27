'use client';

import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import axios from 'axios';

interface Product {
  id: number;
  name: string;
  name_ko?: string;
  description?: string;
  description_ko?: string;
  price_original: number;
  price_krw: number;
  image_url?: string;
  images?: string[];
  supplier_name?: string;
  rating?: number;
  review_count?: number;
  sold_count?: number;
  discount_percent?: number;
  is_hot?: boolean;
  free_shipping?: boolean;
}

interface ProductGridProps {
  limit?: number;
  category?: string;
  search?: string;
  columns?: 2 | 3 | 4;
}

// DummyJSON API 상품을 우리 형식으로 변환
interface DummyJSONProduct {
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

// 카테고리 매핑 (DummyJSON -> 한글)
const categoryKoMap: Record<string, string> = {
  'smartphones': '스마트폰',
  'laptops': '노트북',
  'fragrances': '향수',
  'skincare': '스킨케어',
  'groceries': '식료품',
  'home-decoration': '홈데코',
  'furniture': '가구',
  'tops': '상의',
  'womens-dresses': '여성 드레스',
  'womens-shoes': '여성 신발',
  'mens-shirts': '남성 셔츠',
  'mens-shoes': '남성 신발',
  'mens-watches': '남성 시계',
  'womens-watches': '여성 시계',
  'womens-bags': '여성 가방',
  'womens-jewellery': '여성 주얼리',
  'sunglasses': '선글라스',
  'automotive': '자동차용품',
  'motorcycle': '오토바이',
  'lighting': '조명',
};

// 공급자 랜덤 할당
const suppliers = ['Temu', 'AliExpress', 'Amazon', '11번가', '쿠팡'];
const getRandomSupplier = () => suppliers[Math.floor(Math.random() * suppliers.length)];

// DummyJSON 상품을 우리 형식으로 변환
const transformProduct = (product: DummyJSONProduct): Product => {
  const exchangeRate = 1350; // USD to KRW
  const originalPrice = product.price / (1 - product.discountPercentage / 100);
  
  return {
    id: product.id,
    name: product.title,
    name_ko: `${product.brand} ${categoryKoMap[product.category] || product.category}`,
    description: product.description,
    price_original: originalPrice,
    price_krw: Math.round(product.price * exchangeRate),
    image_url: product.thumbnail,
    images: product.images,
    supplier_name: getRandomSupplier(),
    rating: product.rating,
    review_count: Math.floor(Math.random() * 5000) + 100,
    sold_count: Math.floor(Math.random() * 20000) + 500,
    discount_percent: Math.round(product.discountPercentage),
    is_hot: product.rating >= 4.5 || product.discountPercentage >= 15,
    free_shipping: product.price >= 20,
  };
};

export default function ProductGrid({ limit = 8, category, search, columns = 4 }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // DummyJSON API에서 상품 데이터 가져오기
        let url = `https://dummyjson.com/products?limit=${limit}`;
        
        // 카테고리 필터
        if (category && category !== 'all') {
          const categoryMap: Record<string, string> = {
            'electronics': 'smartphones',
            'fashion': 'tops',
            'home': 'home-decoration',
            'beauty': 'skincare',
            'sports': 'automotive',
          };
          const mappedCategory = categoryMap[category] || category;
          url = `https://dummyjson.com/products/category/${mappedCategory}?limit=${limit}`;
        }
        
        // 검색 필터
        if (search) {
          url = `https://dummyjson.com/products/search?q=${encodeURIComponent(search)}&limit=${limit}`;
        }

        const response = await axios.get(url);
        const transformedProducts = response.data.products.map(transformProduct);
        setProducts(transformedProducts);
      } catch (error) {
        console.error('상품을 불러오는데 실패했습니다:', error);
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
