import { Product } from './product';
// import { AvailableProduct } from './product';

export interface CartItem {
  _id: string;
  customerCode: string;
  product_id: Product;
  // availableProduct_id?: AvailableProduct;
  quantity: number;
  price: number;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface CouponCode {
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  minOrder?: number;
  expiresAt: string;
}

export interface CartState {
  items: CartItem[];
  total: number;
  subtotal: number;
  shippingCost: number;
  discount: number;
  coupon?: CouponCode;
  isLoading: boolean;
  error: string | null;
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  shippingCost?: number;
  discount?: number;
  total: number;
}
