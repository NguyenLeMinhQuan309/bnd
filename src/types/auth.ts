/**
 * Authentication Types
 */

export interface AuthUser {
  code: string;
  name?: string;
  password?: string;
  address?: string;
  nghiviec?: boolean;
}

export interface LoginRequest {
  code: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

export interface RegisterRequest {
  code: string;
  password: string;
}

export interface RegisterResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
