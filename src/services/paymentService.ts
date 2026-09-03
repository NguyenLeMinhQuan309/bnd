import { apiClient } from './api';

export interface PaymentRequest {
  orderId: string;
  amount: number;
  method: 'credit-card' | 'debit-card' | 'paypal' | 'bank-transfer';
  cardDetails?: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    holderName: string;
  };
}

export interface PaymentResponse {
  transactionId: string;
  status: 'success' | 'failed' | 'pending';
  message: string;
}

export const paymentService = {
  async processPayment(data: PaymentRequest): Promise<PaymentResponse> {
    return apiClient.post<PaymentResponse>('/payments/process', data);
  },

  async getPaymentMethods(): Promise<any[]> {
    return apiClient.get<any[]>('/payments/methods');
  },

  async savePaymentMethod(data: any): Promise<{ success: boolean; methodId: string }> {
    return apiClient.post<{ success: boolean; methodId: string }>('/payments/methods', data);
  },

  async verifyPayment(transactionId: string): Promise<{ verified: boolean; status: string }> {
    return apiClient.get<{ verified: boolean; status: string }>(`/payments/${transactionId}/verify`);
  },

  async refund(transactionId: string, amount?: number): Promise<{ success: boolean; refundId: string; message: string }> {
    return apiClient.post<{ success: boolean; refundId: string; message: string }>(`/payments/${transactionId}/refund`, { amount });
  },
};
