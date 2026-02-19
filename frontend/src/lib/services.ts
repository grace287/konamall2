import { api } from './api';
import type {
  Product,
  ProductListResponse,
  CartResponse,
  Category,
} from '@/types';

// 백엔드 연결 여부 캐시 + 동시 호출 시 단일 요청만 수행
// 기본값: /health 호출 안 함(상품은 DummyJSON). NEXT_PUBLIC_USE_BACKEND=true 일 때만 헬스 체크 → ERR_CONNECTION_REFUSED 방지
let backendAvailable: boolean | null = null;
let healthCheckPromise: Promise<boolean> | null = null;

function shouldCheckBackend(): boolean {
  const v = process.env.NEXT_PUBLIC_USE_BACKEND;
  return v === 'true' || v === '1';
}

export async function getBackendAvailable(): Promise<boolean> {
  if (backendAvailable !== null) return backendAvailable;
  if (!shouldCheckBackend()) {
    backendAvailable = false;
    return false;
  }
  if (healthCheckPromise) return healthCheckPromise;
  healthCheckPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      backendAvailable = res.ok;
      return backendAvailable;
    } catch (_) {
      backendAvailable = false;
      return false;
    } finally {
      healthCheckPromise = null;
    }
  })();
  return healthCheckPromise;
}

// ============ Products API ============
export const productsApi = {
  // 상품 목록 조회
  getAll: async (params?: {
    skip?: number;
    limit?: number;
    page?: number;
    category?: string;
    search?: string;
    min_price?: number;
    max_price?: number;
  }): Promise<ProductListResponse> => {
    // page를 skip으로 변환
    const apiParams = {
      ...params,
      skip: params?.page ? (params.page - 1) * (params.limit || 20) : params?.skip,
    };
    delete (apiParams as any).page;
    
    const response = await api.get('/api/products/', { params: apiParams });
    return response.data;
  },

  // 상품 목록 조회 (별칭)
  getProducts: async (params?: {
    skip?: number;
    limit?: number;
    category?: string;
    search?: string;
    min_price?: number;
    max_price?: number;
  }): Promise<ProductListResponse> => {
    const response = await api.get('/api/products/', { params });
    return response.data;
  },

  // 상품 상세 조회
  getProduct: async (id: number): Promise<Product> => {
    const response = await api.get(`/api/products/${id}`);
    return response.data;
  },

  // 상품 상세 조회 (별칭)
  getById: async (id: number): Promise<Product> => {
    return productsApi.getProduct(id);
  },

  // 외부 ID로 상품 조회
  getProductByExternalId: async (externalId: string): Promise<Product> => {
    const response = await api.get(`/api/products/external/${externalId}`);
    return response.data;
  },

  // 카테고리 목록
  getCategories: async (): Promise<string[]> => {
    const response = await api.get('/api/products/categories/list');
    return response.data;
  },
};

// ============ Cart API ============
export const cartApi = {
  // 장바구니 조회
  get: async (): Promise<CartResponse> => {
    const response = await api.get('/api/cart');
    return response.data;
  },

  // 장바구니 조회 (별칭)
  getCart: async (): Promise<CartResponse> => {
    return cartApi.get();
  },

  // 장바구니에 상품 추가
  addItem: async (productId: number, quantity: number, variantId?: number): Promise<CartResponse> => {
    const response = await api.post('/api/cart/items', {
      product_id: productId,
      variant_id: variantId,
      quantity,
    });
    return response.data;
  },

  // 장바구니에 상품 추가 (별칭)
  addToCart: async (params: {
    product_id: number;
    variant_id?: number;
    quantity: number;
  }): Promise<CartResponse> => {
    const response = await api.post('/api/cart/items', params);
    return response.data;
  },

  // 장바구니 아이템 수량 변경
  updateItem: async (productId: number, quantity: number, variantId?: number): Promise<CartResponse> => {
    const response = await api.put('/api/cart/items', { 
      product_id: productId,
      variant_id: variantId,
      quantity 
    });
    return response.data;
  },

  // 장바구니 아이템 수량 변경 (별칭)
  updateCartItem: async (itemId: number, quantity: number): Promise<CartResponse> => {
    const response = await api.put(`/api/cart/items/${itemId}`, { quantity });
    return response.data;
  },

  // 장바구니 아이템 삭제
  removeItem: async (productId: number, variantId?: number): Promise<void> => {
    await api.delete('/api/cart/items', { 
      data: { product_id: productId, variant_id: variantId } 
    });
  },

  // 장바구니 아이템 삭제 (별칭)
  removeCartItem: async (itemId: number): Promise<void> => {
    await api.delete(`/api/cart/items/${itemId}`);
  },

  // 장바구니 비우기
  clear: async (): Promise<void> => {
    await api.delete('/api/cart');
  },

  // 장바구니 비우기 (별칭)
  clearCart: async (): Promise<void> => {
    return cartApi.clear();
  },
};

// ============ Categories API ============
// 백엔드 미실행 시에도 콘솔 ERR_CONNECTION_REFUSED 방지: 네트워크 호출 없이 정적 목록만 반환.
export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    return [...CATEGORIES];
  },

  getBySlug: async (slug: string): Promise<Category> => {
    const found = CATEGORIES.find((c) => c.slug === slug);
    return found ?? { id: 0, name: slug, name_ko: slug, slug, icon: '🏷️', color: 'bg-gray-100' };
  },
};

// ============ Orders API ============
export const ordersApi = {
  // 주문 생성 (장바구니 기반, address_id 사용)
  createOrder: async (params: { address_id: number; payment_method?: string; note?: string }) => {
    const response = await api.post('/api/orders', {
      address_id: params.address_id,
      payment_method: params.payment_method || 'kakao_pay',
      note: params.note,
    });
    return response.data;
  },

  // 주문 목록 조회
  getOrders: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/api/orders', { params: { page: params?.page || 1, limit: params?.limit || 20 } });
    return response.data;
  },

  // 주문 상세 조회
  getOrder: async (orderId: number) => {
    const response = await api.get(`/api/orders/${orderId}`);
    return response.data;
  },

  // 주문 취소
  cancelOrder: async (orderId: number) => {
    const response = await api.post(`/api/orders/${orderId}/cancel`);
    return response.data;
  },
};

// ============ Payments API ============
export const paymentsApi = {
  prepare: async (orderId: number, gateway: string = 'kakao_pay') => {
    const response = await api.post('/api/payments/prepare', { order_id: orderId, gateway });
    return response.data;
  },
  approve: async (orderId: number, paymentId: string, pgToken: string, gateway: string = 'kakao_pay') => {
    const response = await api.post('/api/payments/approve', {
      order_id: orderId,
      payment_id: paymentId,
      pg_token: pgToken,
      gateway,
    });
    return response.data;
  },
  status: async (paymentId: string, gateway: string = 'kakao_pay') => {
    const response = await api.get(`/api/payments/status/${paymentId}`, { params: { gateway } });
    return response.data;
  },
};

// ============ Addresses API ============
export interface AddressOut {
  id: number;
  recipient_name: string;
  phone: string;
  zip_code: string;
  address1: string;
  address2?: string;
  is_default: boolean;
  created_at?: string;
}

export const addressesApi = {
  list: async (): Promise<AddressOut[]> => {
    const response = await api.get('/api/users/addresses');
    return response.data;
  },
  create: async (body: {
    recipient_name: string;
    phone: string;
    zip_code: string;
    address1: string;
    address2?: string;
    is_default?: boolean;
  }) => {
    const response = await api.post('/api/users/addresses', body);
    return response.data;
  },
};

// ============ Users API ============
export const usersApi = {
  // 회원가입
  register: async (params: {
    name: string;
    email: string;
    password: string;
  }) => {
    const response = await api.post('/api/users/register', params);
    return response.data;
  },

  // 로그인
  login: async (params: { email: string; password: string }) => {
    const response = await api.post('/api/users/login', params);
    return response.data;
  },

  // 내 정보 조회
  getMe: async () => {
    const response = await api.get('/api/users/me');
    return response.data;
  },

  // 내 정보 수정
  updateMe: async (params: { name?: string; phone?: string }) => {
    const response = await api.patch('/api/users/me', params);
    return response.data;
  },
};

// ============ Categories (Static Data) ============
export const CATEGORIES: Category[] = [
  { id: 1, name: 'Fashion', name_ko: '패션', slug: 'fashion', icon: '👕', color: 'bg-pink-100' },
  { id: 2, name: 'Electronics', name_ko: '전자기기', slug: 'electronics', icon: '📱', color: 'bg-blue-100' },
  { id: 3, name: 'Home & Living', name_ko: '홈 & 리빙', slug: 'home', icon: '🏠', color: 'bg-green-100' },
  { id: 4, name: 'Beauty', name_ko: '뷰티', slug: 'beauty', icon: '💄', color: 'bg-purple-100' },
  { id: 5, name: 'Sports', name_ko: '스포츠', slug: 'sports', icon: '⚽', color: 'bg-orange-100' },
  { id: 6, name: 'Games & Hobby', name_ko: '게임 & 취미', slug: 'games', icon: '🎮', color: 'bg-indigo-100' },
  { id: 7, name: 'Kids', name_ko: '아동', slug: 'kids', icon: '👶', color: 'bg-yellow-100' },
  { id: 8, name: 'Pets', name_ko: '반려동물', slug: 'pets', icon: '🐕', color: 'bg-teal-100' },
  { id: 9, name: 'Automotive', name_ko: '자동차용품', slug: 'automotive', icon: '🚗', color: 'bg-slate-100' },
  { id: 10, name: 'Groceries', name_ko: '식품', slug: 'groceries', icon: '🍎', color: 'bg-red-100' },
];

// 카테고리 ID → 한글 변환
export const getCategoryName = (categoryId: string): string => {
  const category = CATEGORIES.find(c => c.slug === categoryId || c.name.toLowerCase() === categoryId.toLowerCase());
  return category?.name_ko || categoryId;
};

// 가격 포맷팅
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ko-KR').format(price);
};

// 할인율 계산
export const calculateDiscount = (original: number, final: number): number => {
  if (original <= 0) return 0;
  return Math.round(((original - final) / original) * 100);
};
