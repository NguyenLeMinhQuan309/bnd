import { apiClient } from './api';
import { Order, CreateOrderRequest } from '../types';

export const orderService = {
  // Toàn bộ đơn hàng (dành cho admin) — ứng với OrderController.getOrders
  async getOrders(): Promise<Order[]> {
    return apiClient.get('/order');
  },

  // Đơn hàng của 1 khách hàng — ứng với OrderController.getOrdersByCustomerCode
  // ⚠️ App mobile PHẢI dùng hàm này, không dùng getOrders() ở trên
  async getOrdersByCustomerCode(customerCode: string): Promise<Order[]> {
    return apiClient.get(`/order/by-customer/${customerCode}`);
  },

  // Chi tiết 1 đơn — ứng với OrderController.getOrderById
  async getOrderById(id: string): Promise<Order> {
    return apiClient.get(`/order/${id}`);
  },

  // Tạo đơn mới — ứng với OrderController.createOrder
  async createOrder(payload: CreateOrderRequest): Promise<Order> {
    return apiClient.post('/order', payload);
  },

  async createOrderFromApp(payload: CreateOrderRequest): Promise<Order> {
    return apiClient.post('/order/createOrderApp', payload);
  },
  
  async cancelOrder(orderId: string, customerCode: string): Promise<Order> {
  return apiClient.patch(`/order/${orderId}/cancel`, { customerCode });
  
},
};
