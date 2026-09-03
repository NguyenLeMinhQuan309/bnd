export const APP_NAME = 'Bannoidia';
export const APP_VERSION = '1.0.0';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.example.com';
export const API_VERSION = process.env.EXPO_PUBLIC_API_VERSION || 'v1';

export const PAYMENT_METHODS = ['credit-card', 'debit-card', 'paypal', 'bank-transfer'] as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

export const ASYNC_STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  AUTH_USER: 'authUser',
  CART: 'cart',
  FAVORITES: 'favorites',
  RECENT_SEARCHES: 'recentSearches',
  LANGUAGE: 'language',
  THEME: 'theme',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  DEFAULT_MAX_LIMIT: 100,
} as const;

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 50,
  MIN_PHONE_LENGTH: 10,
  MAX_PHONE_LENGTH: 20,
} as const;

export const DEBOUNCE_DELAY = 500; // ms
export const TIMEOUT_DELAY = 10000; // ms
