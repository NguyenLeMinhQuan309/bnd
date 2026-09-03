/**
 * User Types
 */

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatar?: string;
  bio?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserAddress {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
  createdAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  gender?: string;
  dateOfBirth?: string;
}

export interface AddressRequest {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault?: boolean;
}
