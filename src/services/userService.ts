import { apiClient } from './api';
import { UserProfile, UserAddress, UpdateProfileRequest, AddressRequest } from '../types';

export const userService = {
  async getProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/customer');
  },

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    return apiClient.put<UserProfile>('/customer', data);
  },

  async uploadAvatar(file: any): Promise<{ success: boolean; url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<{ success: boolean; url: string }>('/customer/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async getAddresses(): Promise<UserAddress[]> {
    return apiClient.get<UserAddress[]>('/address');
  },

  async getAddressById(id: string): Promise<UserAddress> {
    return apiClient.get<UserAddress>(`/address/${id}`);
  },

  async createAddress(data: AddressRequest): Promise<UserAddress> {
    return apiClient.post<UserAddress>('/address', data);
  },

  async updateAddress(id: string, data: AddressRequest): Promise<UserAddress> {
    return apiClient.put<UserAddress>(`/address/${id}`, data);
  },

  async deleteAddress(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/address/${id}`);
  },

  async setDefaultAddress(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>(`/address/${id}/default`);
  },
};
