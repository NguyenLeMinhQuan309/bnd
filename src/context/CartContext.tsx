import React, { createContext, useState, useCallback, useEffect } from 'react';
import { CartItem, CartState, CouponCode } from '../types';
import { cartService } from '../services/cartService';
import { useAuth } from '../hooks/useAuth';

export interface CartContextType {
  items: CartItem[];
  total: number;
  subtotal: number;
  shippingCost: number;
  discount: number;
  coupon: CouponCode | undefined;
  isLoading: boolean;
  error: string | null;
  addItem: (productId: string,  quantity: number, price: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<CartState>({
    items: [],
    total: 0,
    subtotal: 0,
    shippingCost: 0,
    discount: 0,
    isLoading: false,
    error: null,
  });

  // Fetch cart from backend
  const fetchCart = useCallback(async () => {
    if (!user?.code) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const response = await cartService.getCartByAccount(user.code);
      setState((prev) => ({
        ...prev,
        items: response.items,
        subtotal: response.subtotal,
        total: response.total,
        isLoading: false,
      }));
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        error: err.message || 'Failed to fetch cart',
        isLoading: false,
      }));
    }
  }, [user?.code]);

  // Add item to cart
  // const addItem = useCallback(
  //   async (productId: string, availableProductId: string, quantity: number, price: number) => {
  //     if (!user?.code) {
  //       setState((prev) => ({ ...prev, error: 'User not authenticated' }));
  //       return;
  //     }

  //     try {
  //       setState((prev) => ({ ...prev, isLoading: true, error: null }));
  //       const newItem = await cartService.addToCart(user.code, productId, availableProductId, quantity, price);
  //       setState((prev) => ({
  //         ...prev,
  //         items: [...prev.items, newItem],
  //         subtotal: prev.subtotal + newItem.subtotal,
  //         total: prev.total + newItem.subtotal,
  //         isLoading: false,
  //       }));
  //     } catch (err: any) {
  //       setState((prev) => ({
  //         ...prev,
  //         error: err.message || 'Failed to add item to cart',
  //         isLoading: false,
  //       }));
  //     }
  //   },
  //   [user?.code]
  // );
  const addItem = useCallback(
  async (productId: string, quantity: number, price: number) => {
    if (!user?.code) {
      setState((prev) => ({ ...prev, error: 'User not authenticated' }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      
      // 1. Gọi API thêm vào giỏ
      await cartService.addToCart(user.code, productId,  quantity, price);
      
      // 2. Gọi lại hàm fetchCart để cập nhật lại toàn bộ State giỏ hàng chuẩn từ API
      await fetchCart(); 
      
      // Tắt loading sau khi đã fetch xong
      setState((prev) => ({ ...prev, isLoading: false }));

    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        error: err.message || 'Failed to add item to cart',
        isLoading: false,
      }));
    }
  },
  [user?.code, fetchCart] // Nhớ thêm fetchCart vào dependency nếu có
);

  // Remove item from cart
  const removeItem = useCallback(async (cartItemId: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      await cartService.removeFromCart(cartItemId);
      await fetchCart();
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        error: err.message || 'Failed to remove item from cart',
        isLoading: false,
      }));
    }
  }, [fetchCart]);

  // Update item quantity
  const updateQuantity = useCallback(async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(cartItemId);
      return;
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      await cartService.updateCartItem(cartItemId, quantity);
      await fetchCart();
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        error: err.message || 'Failed to update quantity',
        isLoading: false,
      }));
    }
  }, [fetchCart, removeItem]);

  // Apply coupon (TODO: implement on backend)
  const applyCoupon = useCallback(async (code: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      const result = await cartService.applyCoupon(code);
      setState((prev) => ({
        ...prev,
        discount: result.discount,
        coupon: {
          code,
          discount: result.discount,
          type: 'percentage',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        isLoading: false,
      }));
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        error: err.message || 'Invalid coupon code',
        isLoading: false,
      }));
    }
  }, []);

  // Remove coupon
  const removeCoupon = useCallback(async () => {
    try {
      await cartService.removeCoupon();
      setState((prev) => ({
        ...prev,
        discount: 0,
        coupon: undefined,
      }));
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        error: err.message || 'Failed to remove coupon',
      }));
    }
  }, []);

  // Clear cart
  const clearCart = useCallback(async () => {
    if (!user?.code) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      await cartService.clearCart(user.code);
      setState({
        items: [],
        total: 0,
        subtotal: 0,
        shippingCost: 0,
        discount: 0,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        error: err.message || 'Failed to clear cart',
        isLoading: false,
      }));
    }
  }, [user?.code]);

  const value: CartContextType = {
    items: state.items,
    total: state.total,
    subtotal: state.subtotal,
    shippingCost: state.shippingCost,
    discount: state.discount,
    coupon: state.coupon,
    isLoading: state.isLoading,
    error: state.error,
    addItem,
    removeItem,
    updateQuantity,
    applyCoupon,
    removeCoupon,
    clearCart,
    fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
