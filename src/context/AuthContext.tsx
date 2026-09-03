import React, { createContext, useState, useCallback, useEffect } from 'react';
import { AuthUser, LoginRequest, RegisterRequest, ChangePasswordRequest } from '../types';
import { authService } from '../services/authService';

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (customer: any) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  clearError: () => void;
  setUserFromBarcode: (userData: any) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(true);

  // In-memory auth state - no persistence needed for demo

  const login = useCallback(async (customer: any) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Customer data:', customer);

      const response = await authService.login(customer);
      setUser(response.user);
      setToken(response.token);
      console.log('User logged in:', response.user);
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: RegisterRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.register(userData);
      setUser(response.user);
      setToken(response.token);
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      // Call logout endpoint if needed
      if (token) {
        try {
          await authService.logout();
        } catch (err) {
          console.warn('Logout endpoint failed:', err);
        }
      }

      // Clear state
      setUser(null);
      setToken(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const changePassword = useCallback(async (data: ChangePasswordRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      await authService.changePassword(data);
    } catch (err: any) {
      const errorMessage = err.message || 'Change password failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setUserFromBarcode = useCallback((userData: any) => {
    console.log('Setting user from barcode:', userData);
    setUser(userData);
    setToken('barcode_token_' + Date.now());
  }, []);

  useEffect(() => {
    console.log('User:', user);
  }, [user]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    error,
    login,
    register,
    logout,
    changePassword,
    clearError,
    setUserFromBarcode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
