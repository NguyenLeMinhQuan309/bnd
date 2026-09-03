import { apiClient } from './api';
import { Order, OrdersResponse, CreateOrderRequest } from '../types';

export const orderService = {
  async getOrders(page: number = 1, limit: number = 10): Promise<OrdersResponse> {
    return apiClient.get<OrdersResponse>('/order', { params: { page, limit } });
  },

  async getOrderById(id: string): Promise<Order> {
    return apiClient.get<Order>(`/order/${id}`);
  },

  async createOrder(data: CreateOrderRequest): Promise<Order> {
    return apiClient.post<Order>('/order', data);
  },

  async cancelOrder(id: string, reason?: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>(`/order/${id}/cancel`, { reason });
  },

  async requestReturn(id: string, reason: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>(`/order/${id}/return`, { reason });
  },

  async getOrderTracking(id: string): Promise<{ trackingNumber: string; status: string; location: string; estimatedDelivery: string }> {
    return apiClient.get<{ trackingNumber: string; status: string; location: string; estimatedDelivery: string }>(`/order/${id}/tracking`);
  },

  async getOrderTimeline(id: string): Promise<any[]> {
    return apiClient.get<any[]>(`/order/${id}/timeline`);
  },

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    return apiClient.put<Order>(`/order/${id}/status`, { status });
  },
};
