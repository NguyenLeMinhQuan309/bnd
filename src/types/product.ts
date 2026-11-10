/**
 * Product Types
 */

export interface Product {
  _id: string;
  id: string;
  name: string;
  description: string;
  prices: Array<{price?: number; date?: Date}>;
  specifications: string;
  unit: string;
  originalPrice: number;
  image: string;
  images: string[];
  category: Category;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stock: number;
  discount?: number;
  createdAt: string;
  categoryid: Category;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductsResponse {
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface AvailableProduct {
  product_id: Product;
  stt: number;
}