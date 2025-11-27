import ProductGrid from '@/components/product/ProductGrid';

interface ProductsPageProps {
  searchParams: { q?: string; category?: string };
}

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">전체 상품</h1>
        {searchParams.q && (
          <p className="text-gray-600 mt-2">
            &quot;{searchParams.q}&quot; 검색 결과
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
        {['전체', '패션', '전자기기', '홈/리빙', '뷰티', '스포츠'].map((cat) => (
          <button
            key={cat}
            className="px-4 py-2 bg-gray-100 rounded-full text-sm whitespace-nowrap hover:bg-gray-200 transition-colors"
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <ProductGrid search={searchParams.q} category={searchParams.category} />
    </div>
  );
}
