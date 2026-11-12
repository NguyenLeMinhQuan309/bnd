import { apiClient } from './api';

export interface CustomerData {
  code: string;
  name: string;
  address: string;
  nghiviec: boolean;
}

export const barcodeService = {
  async getCustomerByBarcode(code: string): Promise<CustomerData> {
    try {
      const response = await apiClient.get<CustomerData>(
        `/customer/${encodeURIComponent(code)}`,
      );
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get customer data');
    }
  },
};
