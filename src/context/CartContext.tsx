import React, {
  createContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { CartItem, CartState, CouponCode } from "../types";
import { cartService } from "../services/cartService";
import { useAuth } from "../hooks/useAuth";
import { useNotification } from "../hooks/useNotification";

export interface CartContextType {
  items: CartItem[];
  total: number;
  subtotal: number;
  shippingCost: number;
  discount: number;
  coupon: CouponCode | undefined;
  isLoading: boolean;
  error: string | null;
  addItem: (
    productId: string,
    quantity: number,
    price: number,
  ) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
}

export const CartContext = createContext<CartContextType | undefined>(
  undefined,
);

const recalcTotals = (
  items: CartItem[],
  shippingCost: number,
  discount: number,
) => {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  return { subtotal, total: subtotal + shippingCost - discount };
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const notification = useNotification();
  const [state, setState] = useState<CartState>({
    items: [],
    total: 0,
    subtotal: 0,
    shippingCost: 0,
    discount: 0,
    isLoading: false,
    error: null,
  });

  // Giữ debounce timer riêng cho từng cartItemId
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );

  useEffect(() => {
    // Dọn timer khi unmount, tránh gọi setState sau khi component đã gỡ
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

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
        error: err.message || "Failed to fetch cart",
        isLoading: false,
      }));
    }
  }, [user?.code]);

  // Add item to cart — không fetchCart() lại toàn bộ, chỉ merge kết quả trả về
  const addItem = useCallback(
    async (productId: string, quantity: number, price: number) => {
      if (!user?.code) {
        setState((prev) => ({ ...prev, error: "User not authenticated" }));
        return;
      }

      try {
        setState((prev) => ({ ...prev, error: null }));

        // Chỉ 1 lần gọi API — backend trả về item đã thêm/cộng dồn
        const updatedItem = await cartService.addToCart(
          user.code,
          productId,
          quantity,
          price,
        );

        setState((prev) => {
          const existingIndex = prev.items.findIndex(
            (item) => item._id === updatedItem._id,
          );
          const newItems =
            existingIndex >= 0
              ? prev.items.map((item, idx) =>
                  idx === existingIndex ? updatedItem : item,
                )
              : [...prev.items, updatedItem];

          const { subtotal, total } = recalcTotals(
            newItems,
            prev.shippingCost,
            prev.discount,
          );
          return { ...prev, items: newItems, subtotal, total };
        });
        notification.success(
          quantity === 1
            ? "Đã thêm 1 sản phẩm vào giỏ hàng"
            : `Đã thêm ${quantity} sản phẩm vào giỏ hàng`,
        );
      } catch (err: any) {
        const message = err.message || "Không thể thêm sản phẩm vào giỏ hàng";
        setState((prev) => ({ ...prev, error: message }));
        notification.error(message, { title: "Thêm vào giỏ hàng thất bại" });
      }
    },
    [user?.code, notification],
  );

  // Remove item from cart — optimistic (giữ nguyên, đã đúng)
  const removeItem = useCallback(async (cartItemId: string) => {
    let previousItems: CartItem[] = [];

    setState((prev) => {
      previousItems = prev.items;
      const newItems = prev.items.filter((item) => item._id !== cartItemId);
      const { subtotal, total } = recalcTotals(
        newItems,
        prev.shippingCost,
        prev.discount,
      );
      return { ...prev, items: newItems, subtotal, total, error: null };
    });

    try {
      await cartService.removeFromCart(cartItemId);
    } catch (err: any) {
      setState((prev) => {
        const { subtotal, total } = recalcTotals(
          previousItems,
          prev.shippingCost,
          prev.discount,
        );
        return {
          ...prev,
          items: previousItems,
          subtotal,
          total,
          error: err.message || "Failed to remove item from cart",
        };
      });
    }
  }, []);

  // Update quantity — optimistic + debounce (sửa chính ở đây)
  const updateQuantity = useCallback(
    async (cartItemId: string, quantity: number) => {
      if (quantity <= 0) {
        await removeItem(cartItemId);
        return;
      }

      // 1. Cập nhật UI NGAY LẬP TỨC — người dùng thấy phản hồi tức thì dù bấm liên tục
      setState((prev) => {
        const newItems = prev.items.map((item) =>
          item._id === cartItemId
            ? { ...item, quantity, subtotal: item.price * quantity }
            : item,
        );
        const { subtotal, total } = recalcTotals(
          newItems,
          prev.shippingCost,
          prev.discount,
        );
        return { ...prev, items: newItems, subtotal, total, error: null };
      });

      // 2. Huỷ request đang chờ (nếu có) cho đúng item này
      if (debounceTimers.current[cartItemId]) {
        clearTimeout(debounceTimers.current[cartItemId]);
      }

      // 3. Chỉ thực sự gửi API sau 400ms không bấm thêm — gộp nhiều lần bấm thành 1 request
      debounceTimers.current[cartItemId] = setTimeout(async () => {
        try {
          await cartService.updateCartItem(cartItemId, quantity);
        } catch (err: any) {
          // Rollback bằng cách đồng bộ lại từ server nếu request cuối cùng thất bại
          setState((prev) => ({
            ...prev,
            error: err.message || "Failed to update quantity",
          }));
          await fetchCart();
        }
      }, 400);
    },
    [removeItem, fetchCart],
  );

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
          type: "percentage",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        isLoading: false,
      }));
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        error: err.message || "Invalid coupon code",
        isLoading: false,
      }));
    }
  }, []);

  const removeCoupon = useCallback(async () => {
    try {
      await cartService.removeCoupon();
      setState((prev) => ({ ...prev, discount: 0, coupon: undefined }));
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        error: err.message || "Failed to remove coupon",
      }));
    }
  }, []);

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
        error: err.message || "Failed to clear cart",
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
