import { apiClient } from './api';
import { CartItem, CartSummary } from '../types';

export const cartService = {
  // Get all cart items for a user
  async getCartByAccount(customerCode: string): Promise<{ items: CartItem[]; total: number; subtotal: number }> {
    return apiClient.get(`/cart/account/${customerCode}`);
  },

  // Add product to cart
  async addToCart(
    customerCode: string,
    productId: string,
    quantity: number,
    price: number
  ): Promise<CartItem> {
    const payload = {
      customerCode,
      product_id: productId,
      quantity,
      price,
    };
    console.log('Adding to cart:', payload);
    try {
      const result = await apiClient.post<CartItem>('/cart', payload);
      console.log('Successfully added to cart:', result);
      return result;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },

  // Remove item from cart
  async removeFromCart(cartItemId: string): Promise<{ message: string }> {
    return apiClient.delete(`/cart/${cartItemId}`);
  },

  // Update cart item quantity
  async updateCartItem(cartItemId: string, quantity: number): Promise<CartItem> {
    return apiClient.put(`/cart/${cartItemId}`, { quantity });
  },

  // Get cart summary
  async getCartSummary(customerCode: string): Promise<CartSummary> {
    return apiClient.get(`/cart/summary/${customerCode}`);
  },

  // Clear all items from cart
  async clearCart(customerCode: string): Promise<{ message: string }> {
    return apiClient.delete(`/cart/account/${customerCode}/clear`);
  },

  // Apply coupon (TODO: implement on backend)
  async applyCoupon(code: string): Promise<{ success: boolean; discount: number; message: string }> {
    return apiClient.post('/order/apply-coupon', { code });
  },

  // Remove coupon (TODO: implement on backend)
  async removeCoupon(): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/order/remove-coupon');
  },

  // Validate coupon (TODO: implement on backend)
  async validateCoupon(code: string): Promise<{ valid: boolean; discount: number }> {
    return apiClient.get(`/order/coupon/${code}`);
  },
};
