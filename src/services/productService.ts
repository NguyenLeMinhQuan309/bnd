import { apiClient } from './api';
import { Product, Category, ProductsResponse } from '../types';
import { mockCategories } from './mockData';

export const productService = {
  async getProducts(params?: any): Promise<ProductsResponse> {
    try {
      const response = await apiClient.get<any>('/product', { params });
      // Handle if API returns an array directly instead of {data, pagination}
      const products = Array.isArray(response) ? response : response.data || [];
      return {
        data: products,
        pagination: {
          total: products.length,
          page: params?.page || 1,
          limit: params?.limit || 10,
          pages: 1,
        },
      };
    } catch (error) {
      console.error('Failed to fetch products:', error);
      // Fallback to mock data on error
      return {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          pages: 1,
        },
      };
    }
  },

  async getProductById(id: string): Promise<Product> {
    try {
      return await apiClient.get<Product>(`/product/${id}`);
    } catch (error) {
      console.error(`Failed to fetch product ${id}:`, error);
      // Fallback to mock data on error
        throw new Error('Product not found');
    }
  },

  async getCategories(params?: any): Promise<Category[]> {
    try {
      const response = await apiClient.get<any>('/category', { params });
      const categories = Array.isArray(response) ? response : response.data || [];
      return categories;
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // Fallback to empty array on error
      return [];
    }
  },

  async getSubCategories(params?: any): Promise<any[]> {
    try {
      const response = await apiClient.get<any>('/subcategory', { params });
      const subCategories = Array.isArray(response) ? response : response.data || [];
      return subCategories;
    } catch (error) {
      console.error('Failed to fetch sub categories:', error);
      // Fallback to empty array on error
      return [];
    }
  }
};
