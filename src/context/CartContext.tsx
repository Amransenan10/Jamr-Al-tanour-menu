import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types';
import { fetchCartById } from '../services/abandonedCartService';

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

const calculateItemUnitPrice = (item: CartItem): number => {
  const optionsTotal = Array.isArray(item.options)
    ? item.options.reduce((sum, opt) => sum + (Number(opt.price) || 0), 0)
    : 0;
  const base = Number(item.price) || 0;
  if (base > 0 || optionsTotal > 0) {
    return base + optionsTotal;
  }
  if (item.totalPrice && item.quantity) {
    return item.totalPrice / item.quantity;
  }
  return 0;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    // 1. Check if URL contains recover_cart or cart/c parameter
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const recoverParam = urlParams.get('recover_cart');
        const cartIdParam = urlParams.get('cart') || urlParams.get('c');

        if (cartIdParam) {
          fetchCartById(cartIdParam).then(record => {
            if (record && Array.isArray(record.items) && record.items.length > 0) {
              const restoredItems: CartItem[] = record.items.map((item: any) => {
                const basePrice = Number(item.price ?? item.pr ?? 0);
                const qty = Number(item.quantity ?? item.q ?? 1);
                const opts = Array.isArray(item.options || item.o) ? (item.options || item.o).map((opt: any) => ({
                  groupId: opt.groupId || opt.g || '',
                  groupName: opt.groupName || opt.gn || '',
                  itemId: opt.itemId || opt.id || '',
                  itemName: opt.itemName || opt.in || '',
                  price: Number(opt.price ?? opt.p ?? 0)
                })) : [];
                const optionsSum = opts.reduce((s: number, o: any) => s + (Number(o.price) || 0), 0);
                const unit = (basePrice + optionsSum) > 0 ? (basePrice + optionsSum) : (Number(item.totalPrice ?? item.t ?? 0) / (qty || 1));
                const total = Math.round(unit * qty * 100) / 100;

                return {
                  id: item.id || item.i || `cart_item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  productId: item.productId || item.p || '',
                  name: item.name || item.n || item.name_ar || 'وجبة',
                  price: basePrice,
                  quantity: qty,
                  options: opts,
                  removedIngredients: item.removedIngredients || item.r || [],
                  totalPrice: total,
                  notes: item.notes || item.nt || ''
                };
              });

              setCart(restoredItems);
              localStorage.setItem('jamr_al_tannour_cart', JSON.stringify(restoredItems));
            }
          }).catch(console.error);
        } else if (recoverParam) {
          // Decode URL-safe base64 payload
          let base64 = recoverParam.replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) {
            base64 += '=';
          }
          const decodedJson = decodeURIComponent(escape(atob(base64)));
          const parsed = JSON.parse(decodedJson);
          const rawItems = Array.isArray(parsed) ? parsed : (parsed.items || parsed.c || []);

          if (Array.isArray(rawItems) && rawItems.length > 0) {
            const restoredItems: CartItem[] = rawItems.map((item: any) => {
              const basePrice = Number(item.price ?? item.pr ?? 0);
              const qty = Number(item.quantity ?? item.q ?? 1);
              const opts = Array.isArray(item.options || item.o) ? (item.options || item.o).map((opt: any) => ({
                groupId: opt.groupId || opt.g || '',
                groupName: opt.groupName || opt.gn || '',
                itemId: opt.itemId || opt.id || '',
                itemName: opt.itemName || opt.in || '',
                price: Number(opt.price ?? opt.p ?? 0)
              })) : [];
              const optionsSum = opts.reduce((s: number, o: any) => s + (Number(o.price) || 0), 0);
              const unit = (basePrice + optionsSum) > 0 ? (basePrice + optionsSum) : (Number(item.totalPrice ?? item.t ?? 0) / (qty || 1));
              const total = Math.round(unit * qty * 100) / 100;

              return {
                id: item.id || item.i || `cart_item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                productId: item.productId || item.p || '',
                name: item.name || item.n || item.name_ar || 'وجبة',
                price: basePrice,
                quantity: qty,
                options: opts,
                removedIngredients: item.removedIngredients || item.r || [],
                totalPrice: total,
                notes: item.notes || item.nt || ''
              };
            });

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
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          const selfHealed = parsed.map((item: CartItem) => {
            const unitPrice = calculateItemUnitPrice(item);
            const correctedTotal = unitPrice > 0 ? Math.round(unitPrice * item.quantity * 100) / 100 : (item.totalPrice || 0);
            return { ...item, totalPrice: correctedTotal };
          });
          setCart(selfHealed);
        }
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
  }, []);

  const restoreCart = (items: CartItem[]) => {
    if (Array.isArray(items) && items.length > 0) {
      const selfHealed = items.map((item: CartItem) => {
        const unitPrice = calculateItemUnitPrice(item);
        const correctedTotal = unitPrice > 0 ? Math.round(unitPrice * item.quantity * 100) / 100 : (item.totalPrice || 0);
        return { ...item, totalPrice: correctedTotal };
      });
      setCart(selfHealed);
      localStorage.setItem('jamr_al_tannour_cart', JSON.stringify(selfHealed));
    }
  };

  useEffect(() => {
    localStorage.setItem('jamr_al_tannour_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    const unitPrice = calculateItemUnitPrice(item);
    const correctedTotal = Math.round(unitPrice * item.quantity * 100) / 100;
    setCart((prev) => [...prev, { ...item, totalPrice: correctedTotal }]);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const newQty = Math.max(1, item.quantity + delta);
          const unitPrice = calculateItemUnitPrice(item);
          const newTotal = Math.round(unitPrice * newQty * 100) / 100;
          return { ...item, quantity: newQty, totalPrice: newTotal };
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
    const unitPrice = calculateItemUnitPrice(item);
    return sum + (unitPrice * item.quantity);
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
