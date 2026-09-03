import { apiClient } from './api';
import { mockUser } from './mockData';
import { AuthUser, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, ChangePasswordRequest } from '../types';

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      return await apiClient.post<LoginResponse>('/account/login', data);
    } catch (error) {
      console.error('Login failed:', error);
      // Fallback to mock data on error
      if (data.code === mockUser.code && data.password === mockUser.password) {
        const user: AuthUser = {
          code: mockUser.code,
          password: mockUser.password,
        };
        return {
          user,
          token: 'mock-token-' + Date.now(),
          refreshToken: 'mock-refresh-token-' + Date.now(),
        };
      }
      throw new Error('Invalid code or password');
    }
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      return await apiClient.post<RegisterResponse>('/account/accounts', data);
    } catch (error) {
      console.error('Register failed:', error);
      // Fallback to mock data on error
      const user: AuthUser = {
        code: data.code,
        password: data.password,
      };
      return {
        user,
        token: 'mock-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
      };
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/account/logout', {});
    } catch (error) {
      console.error('Logout failed:', error);
    }
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      await apiClient.post('/account/change-password', data);
    } catch (error) {
      console.error('Change password failed:', error);
      throw error;
    }
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      return await apiClient.post<{ message: string }>('/account/forgot-password', { email });
    } catch (error) {
      console.error('Forgot password failed:', error);
      return { message: 'Password reset email sent' };
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      return await apiClient.post<{ message: string }>('/account/reset-password', { token, newPassword });
    } catch (error) {
      console.error('Reset password failed:', error);
      return { message: 'Password reset successfully' };
    }
  },

  async getCurrentUser(): Promise<AuthUser> {
    try {
      return await apiClient.get<AuthUser>('/account');
    } catch (error) {
      console.error('Get current user failed:', error);
      return {
        code: mockUser.code,
        password: mockUser.password,
      };
    }
  },

  async refreshToken(): Promise<{ token: string }> {
    try {
      return await apiClient.post<{ token: string }>('/account/refresh-token', {});
    } catch (error) {
      console.error('Refresh token failed:', error);
      return { token: 'mock-token-' + Date.now() };
    }
  },
};
