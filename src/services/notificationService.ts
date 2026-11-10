import { apiClient } from './api';

export interface CustomerNotification {
  _id: string;
  type: string;
  title: string;
  orderId: string;
  order: string;
  customerCode: string;
  createdAt: string;
}

export const notificationService = {
  async getByCustomerCode(customerCode: string): Promise<CustomerNotification[]> {
    return apiClient.get<CustomerNotification[]>(
      `/notifications/customer/${encodeURIComponent(customerCode)}`,
    );
  },
};