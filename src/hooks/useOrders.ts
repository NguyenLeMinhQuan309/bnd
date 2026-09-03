import { useState, useCallback } from 'react';
import { Order, OrdersResponse } from '../types';
import { orderService } from '../services/orderService';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  const fetchOrders = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await orderService.getOrders(page, limit);
      setOrders(response.data);
      setPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const cancelOrder = useCallback(async (id: string, reason?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await orderService.cancelOrder(id, reason);
      await fetchOrders(pagination.page, pagination.limit);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel order');
    } finally {
      setIsLoading(false);
    }
  }, [pagination]);

  const requestReturn = useCallback(async (id: string, reason: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await orderService.requestReturn(id, reason);
      await fetchOrderById(id);
    } catch (err: any) {
      setError(err.message || 'Failed to request return');
    } finally {
      setIsLoading(false);
    }
  }, [fetchOrderById]);

  return {
    orders,
    currentOrder,
    isLoading,
    error,
    pagination,
    fetchOrders,
    fetchOrderById,
    cancelOrder,
    requestReturn,
  };
};
