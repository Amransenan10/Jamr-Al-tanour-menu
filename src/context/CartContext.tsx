import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  restoreCart: (items: CartItem[]) => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    // 1. Check if URL contains recover_cart parameter
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const recoverParam = urlParams.get('recover_cart');
        if (recoverParam) {
          // Decode URL-safe base64 payload
          let base64 = recoverParam.replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) {
            base64 += '=';
          }
          const decodedJson = decodeURIComponent(escape(atob(base64)));
          const parsed = JSON.parse(decodedJson);
          const rawItems = Array.isArray(parsed) ? parsed : (parsed.items || parsed.c || []);

          if (Array.isArray(rawItems) && rawItems.length > 0) {
            const restoredItems: CartItem[] = rawItems.map((item: any) => ({
              id: item.id || item.i || `cart_item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              productId: item.productId || item.p || '',
              name: item.name || item.n || item.name_ar || 'وجبة',
              price: Number(item.price ?? item.pr ?? 0),
              quantity: Number(item.quantity ?? item.q ?? 1),
              options: Array.isArray(item.options || item.o) ? (item.options || item.o).map((opt: any) => ({
                groupId: opt.groupId || opt.g || '',
                groupName: opt.groupName || opt.gn || '',
                itemId: opt.itemId || opt.id || '',
                itemName: opt.itemName || opt.in || '',
                price: Number(opt.price ?? opt.p ?? 0)
              })) : [],
              removedIngredients: item.removedIngredients || item.r || [],
              totalPrice: Number(item.totalPrice ?? item.t ?? item.price ?? 0),
              notes: item.notes || item.nt || ''
            }));

            setCart(restoredItems);
            localStorage.setItem('jamr_al_tannour_cart', JSON.stringify(restoredItems));
            return;
          }
        }
      } catch (err) {
        // Fallback to normal storage loading
      }
    }

    const savedCart = localStorage.getItem('jamr_al_tannour_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
  }, []);

  const restoreCart = (items: CartItem[]) => {
    if (Array.isArray(items) && items.length > 0) {
      setCart(items);
      localStorage.setItem('jamr_al_tannour_cart', JSON.stringify(items));
    }
  };

  useEffect(() => {
    localStorage.setItem('jamr_al_tannour_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => [...prev, item]);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => {
    const itemBasePrice = item.price;
    const optionsPrice = item.options.reduce((s, o) => s + o.price, 0);
    return sum + (itemBasePrice + optionsPrice) * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        restoreCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
