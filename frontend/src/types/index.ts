// Product Types
export interface Product {
  id: number;
  external_id: string;
  title: string;
  title_ko?: string;
  description?: string;
  description_ko?: string;
  price_original: number;
  price_final: number;
  currency: string;
  stock: number;
  is_active: boolean;
  category?: string;
  tags: string[];
  origin_url?: string;
  main_image_url?: string;
  shipping_days_min: number;
  shipping_days_max: number;
  supplier?: Supplier;
  variants?: ProductVariant[];
  images?: ProductImage[];
  created_at: string;
  updated_at?: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  external_variant_id?: string;
  sku?: string;
  name: string;
  price_usd?: number;
  price_krw?: number;
  stock: number;
}

export interface ProductImage {
  id: number;
  product_id: number;
  url: string;
  is_main: boolean;
  sort_order: number;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  skip: number;
  limit: number;
}

// Supplier Types
export interface Supplier {
  id: number;
  name: string;
  supplier_type: 'temu' | 'aliexpress' | 'amazon' | 'local';
  is_active: boolean;
}

// Cart Types
export interface CartItem {
  id: number;
  product_id: number;
  variant_id?: number;
  quantity: number;
  product_title: string;
  product_image?: string;
  price_krw: number;
  line_total: number;
}

export interface CartResponse {
  id: number;
  items: CartItem[];
  subtotal: number;
  shipping_fee: number;
  total: number;
}

// Order Types
export type OrderStatus = 
  | 'pending' 
  | 'paid' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'refunded';

export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  payment_status: string;
  subtotal_krw: number;
  shipping_cost_krw: number;
  total_amount: number;
  shipping_name: string;
  shipping_phone: string;
  shipping_address1: string;
  shipping_address2?: string;
  items: OrderItem[];
  created_at: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_title: string;
  variant_name?: string;
  quantity: number;
  unit_price: number;
}

// Category Types
export interface Category {
  id: number | string;
  name: string;
  name_ko?: string;
  slug: string;
  description?: string;
  parent_id?: number;
  icon?: string;
  color?: string;
  image_url?: string;
}

// User Types
export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'admin' | 'seller';
  is_active: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}
