import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, ProductVariant } from '@/types/products';
import { SubscriptionFrequency } from '@/types/subscriptions';

export interface CartItem {
  id: string; // unique item id
  product: Product;
  variant: ProductVariant;
  quantity: number;
  orderMode: 'one_time' | 'subscription';
  frequency?: SubscriptionFrequency;
  customDays?: number[]; // [1, 3, 5] for Mon, Wed, Fri
}

interface CartContextType {
  items: CartItem[];
  addToCart: (
    product: Product,
    variant: ProductVariant,
    quantity?: number,
    orderMode?: 'one_time' | 'subscription',
    frequency?: SubscriptionFrequency,
    customDays?: number[]
  ) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  totalCount: number;
  hasSubscriptionItem: boolean;
  hasOneTimeItem: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'ksheeraam_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage error
    }
  }, [items]);

  const addToCart = (
    product: Product,
    variant: ProductVariant,
    quantity = 1,
    orderMode: 'one_time' | 'subscription' = 'one_time',
    frequency: SubscriptionFrequency = 'daily',
    customDays: number[] = [1, 2, 3, 4, 5, 6, 0]
  ) => {
    setItems((prev) => {
      // Look for matching item with same product, variant, and orderMode
      const existingIndex = prev.findIndex(
        (i) =>
          i.product.id === product.id &&
          i.variant.id === variant.id &&
          i.orderMode === orderMode &&
          (orderMode === 'one_time' || i.frequency === frequency)
      );

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      }

      const newItem: CartItem = {
        id: `${product.id}_${variant.id}_${orderMode}_${Date.now()}`,
        product,
        variant,
        quantity,
        orderMode,
        frequency: orderMode === 'subscription' ? frequency : undefined,
        customDays: orderMode === 'subscription' && frequency === 'custom' ? customDays : undefined,
      };

      return [...prev, newItem];
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, quantity } : it)));
  };

  const removeFromCart = (itemId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCount = items.reduce((acc, it) => acc + it.quantity, 0);
  const hasSubscriptionItem = items.some((it) => it.orderMode === 'subscription');
  const hasOneTimeItem = items.some((it) => it.orderMode === 'one_time');

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalCount,
        hasSubscriptionItem,
        hasOneTimeItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
