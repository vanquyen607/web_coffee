import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, options?: CartItem['options']) => void;
  updateQuantity: (productId: string, quantity: number, options?: CartItem['options']) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => 
        i.productId === item.productId && 
        i.options?.sugar === item.options?.sugar && 
        i.options?.ice === item.options?.ice
      );
      
      if (existing) {
        return prev.map((i) => 
          (i.productId === item.productId && 
           i.options?.sugar === item.options?.sugar && 
           i.options?.ice === item.options?.ice)
            ? { ...i, quantity: i.quantity + item.quantity } 
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeItem = (productId: string, options?: CartItem['options']) => {
    setItems((prev) => prev.filter((i) => 
      !(i.productId === productId && 
        i.options?.sugar === options?.sugar && 
        i.options?.ice === options?.ice)
    ));
  };

  const updateQuantity = (productId: string, quantity: number, options?: CartItem['options']) => {
    if (quantity <= 0) {
      removeItem(productId, options);
      return;
    }
    setItems((prev) => 
      prev.map((i) => (
        i.productId === productId && 
        i.options?.sugar === options?.sugar && 
        i.options?.ice === options?.ice
      ) ? { ...i, quantity } : i)
    );
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
