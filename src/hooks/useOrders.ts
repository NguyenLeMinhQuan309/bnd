import { useState, useCallback } from 'react';
import { Order } from '../types';
import { orderService } from '../services/orderService';
import { useAuth } from './useAuth';

export const useOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user?.code) {
      setOrders([]);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      // Chỉ lấy đơn của khách đang đăng nhập — KHÔNG dùng getOrders() (toàn bộ đơn, dành cho admin)
      const data = await orderService.getOrdersByCustomerCode(user.code);
      setOrders(Array.isArray(data) ? data : []);
      console.log('Fetched orders:', data);
    } catch (err: any) {
      setOrders([]);
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  }, [user?.code]);

  const fetchOrderById = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const order = await orderService.getOrderById(id);
      setCurrentOrder(order);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    orders,
    currentOrder,
    isLoading,
    error,
    fetchOrders,
    fetchOrderById,
  };
};