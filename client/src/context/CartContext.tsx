import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getEffectiveUnitPrice } from '../lib/api';
import { Product } from '../types';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SupplierCartGroup {
  supplierId: string;
  supplierName: string;
  supplierVerified: boolean;
  neighborhood: string;
  items: {
    product: Product;
    quantity: number;
    effectiveUnitPrice: number;
    lineTotalKes: number;
  }[];
  subtotalKes: number;
}

interface CartContextValue {
  items: CartItem[];
  groups: SupplierCartGroup[];
  totalCount: number;
  subtotalKes: number;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = 'suuqly_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      // ignore storage quota errors
    }
  }, [items]);

  const addToCart = (product: Product, quantity?: number) => {
    const qtyToAdd = Math.max(product.moq, quantity || product.moq);
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const nextQty = Math.min(product.stock, existing.quantity + qtyToAdd);
        return prev.map((i) =>
          i.product.id === product.id ? { product, quantity: nextQty } : i
        );
      }
      return [...prev, { product, quantity: Math.min(product.stock, qtyToAdd) }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.product.id !== productId) return i;
        const clamped = Math.max(i.product.moq, Math.min(i.product.stock, quantity));
        return { ...i, quantity: clamped };
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => setItems([]);

  const groups = useMemo<SupplierCartGroup[]>(() => {
    const map = new Map<string, SupplierCartGroup>();
    for (const item of items) {
      const supId = item.product.supplierId;
      const supName =
        item.product.supplier?.name || item.product.supplierName || 'Verified Garissa Supplier';
      const supVerified = item.product.supplier?.verified ?? true;
      const neighborhood = item.product.supplier?.neighborhood || 'Garissa Town';
      const effectiveUnitPrice = getEffectiveUnitPrice(
        item.product.unitPriceKes,
        item.product.priceTiers,
        item.quantity
      );
      const lineTotalKes = effectiveUnitPrice * item.quantity;

      const group = map.get(supId) || {
        supplierId: supId,
        supplierName: supName,
        supplierVerified: supVerified,
        neighborhood,
        items: [],
        subtotalKes: 0,
      };
      group.items.push({
        product: item.product,
        quantity: item.quantity,
        effectiveUnitPrice,
        lineTotalKes,
      });
      group.subtotalKes += lineTotalKes;
      map.set(supId, group);
    }
    return Array.from(map.values());
  }, [items]);

  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotalKes = useMemo(
    () => groups.reduce((sum, g) => sum + g.subtotalKes, 0),
    [groups]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        groups,
        totalCount,
        subtotalKes,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
