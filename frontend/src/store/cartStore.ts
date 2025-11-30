import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartApi } from '@/lib/services';
import toast from 'react-hot-toast';

export interface CartItem {
  id: number;
  productId: number;
  variantId?: number;
  name: string;
  nameKo?: string;
  price: number;
  priceKrw: number;
  quantity: number;
  imageUrl?: string;
  variant?: string;
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuthenticated: (auth: boolean) => void;
  
  // 로컬 장바구니 작업
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  getTotalKrw: () => number;
  getTotalItems: () => number;
  
  // 서버 동기화
  syncWithServer: () => Promise<void>;
  saveToServer: () => Promise<void>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isAuthenticated: false,

      setAuthenticated: (auth) => {
        set({ isAuthenticated: auth });
        if (auth) {
          // 로그인 시 서버와 동기화
          get().syncWithServer();
        }
      },

      addItem: async (item) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        );

        if (existingIndex > -1) {
          const updated = [...items];
          updated[existingIndex].quantity += item.quantity;
          set({ items: updated });
        } else {
          const newItem: CartItem = {
            ...item,
            id: Date.now(),
          };
          set({ items: [...items, newItem] });
        }

        // 인증된 경우 서버에도 추가
        if (get().isAuthenticated) {
          try {
            await cartApi.addItem(item.productId, item.quantity, item.variantId);
          } catch (error) {
            console.error('서버 장바구니 추가 실패:', error);
          }
        }
      },

      removeItem: async (id) => {
        const item = get().items.find(i => i.id === id);
        set({ items: get().items.filter((item) => item.id !== id) });
        
        // 인증된 경우 서버에서도 제거
        if (get().isAuthenticated && item) {
          try {
            await cartApi.removeItem(item.productId, item.variantId);
          } catch (error) {
            console.error('서버 장바구니 제거 실패:', error);
          }
        }
      },

      updateQuantity: async (id, quantity) => {
        if (quantity < 1) return;
        const item = get().items.find(i => i.id === id);
        const items = get().items.map((item) =>
          item.id === id ? { ...item, quantity } : item
        );
        set({ items });

        // 인증된 경우 서버에서도 업데이트
        if (get().isAuthenticated && item) {
          try {
            await cartApi.updateItem(item.productId, quantity, item.variantId);
          } catch (error) {
            console.error('서버 장바구니 업데이트 실패:', error);
          }
        }
      },

      clearCart: async () => {
        set({ items: [] });
        
        // 인증된 경우 서버에서도 비우기
        if (get().isAuthenticated) {
          try {
            await cartApi.clear();
          } catch (error) {
            console.error('서버 장바구니 비우기 실패:', error);
          }
        }
      },

      getTotalKrw: () => {
        return get().items.reduce(
          (sum, item) => sum + item.priceKrw * item.quantity,
          0
        );
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      syncWithServer: async () => {
        if (!get().isAuthenticated) return;
        
        set({ isLoading: true });
        try {
          const serverCart = await cartApi.get();
          
          if (serverCart && serverCart.items && serverCart.items.length > 0) {
            // 서버 장바구니가 있으면 로컬과 병합
            const localItems = get().items;
            const mergedItems: CartItem[] = [];
            
            // 서버 아이템 추가
            serverCart.items.forEach((serverItem: any) => {
              const existing = localItems.find(
                (local) => local.productId === serverItem.product_id && 
                           local.variantId === serverItem.variant_id
              );
              
              mergedItems.push({
                id: Date.now() + Math.random(),
                productId: serverItem.product_id,
                variantId: serverItem.variant_id,
                name: serverItem.product?.title || '',
                nameKo: serverItem.product?.title_ko || '',
                price: serverItem.product?.price_original || 0,
                priceKrw: serverItem.product?.price_final || 0,
                quantity: existing 
                  ? Math.max(existing.quantity, serverItem.quantity)
                  : serverItem.quantity,
                imageUrl: serverItem.product?.main_image_url,
                variant: serverItem.variant?.name,
              });
            });
            
            // 로컬에만 있는 아이템 추가 (서버에 없는 것)
            localItems.forEach((localItem) => {
              const existsInServer = serverCart.items.some(
                (s: any) => s.product_id === localItem.productId && 
                            s.variant_id === localItem.variantId
              );
              if (!existsInServer) {
                mergedItems.push(localItem);
                // 서버에도 추가
                cartApi.addItem(localItem.productId, localItem.quantity, localItem.variantId)
                  .catch(console.error);
              }
            });
            
            set({ items: mergedItems });
          } else if (get().items.length > 0) {
            // 서버 장바구니가 비어있고 로컬에 아이템이 있으면 서버로 전송
            await get().saveToServer();
          }
        } catch (error) {
          console.error('장바구니 동기화 실패:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      saveToServer: async () => {
        if (!get().isAuthenticated) return;
        
        const items = get().items;
        for (const item of items) {
          try {
            await cartApi.addItem(item.productId, item.quantity, item.variantId);
          } catch (error) {
            console.error('서버에 아이템 저장 실패:', error);
          }
        }
      },
    }),
    {
      name: 'konamall-cart',
      partialize: (state) => ({ items: state.items }), // items만 persist
    }
  )
);
