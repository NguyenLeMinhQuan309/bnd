import { apiClient } from './api';
import { AvailableProduct } from '../types';

export const availableProductService = {
	async getAvailableProducts(params?: { category_id?: string }): Promise<AvailableProduct[]> {
		const response = await apiClient.get<AvailableProduct[]>('/available', { params });
		return Array.isArray(response) ? response : [];
	},
};
