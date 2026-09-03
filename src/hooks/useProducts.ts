import { useState, useCallback } from 'react';
import { Product, ProductsResponse, Category } from '../types';
import { productService } from '../services/productService';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  const fetchProducts = useCallback(async (page: number = 1, limit: number = 10, params?: any) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await productService.getProducts({ ...params, page, limit });
      setProducts(response.data);
      setPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProductById = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const product = await productService.getProductById(id);
      setCurrentProduct(product);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch product');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // const getProductsByCategory = useCallback(async (categoryId: string, page: number = 1, limit: number = 10) => {
  //   try {
  //     setIsLoading(true);
  //     setError(null);

  //     const response = await productService.getProductsByCategory(categoryId, { page, limit });
  //     setProducts(response.data);
  //     setPagination({
  //       page: response.pagination.page,
  //       limit: response.pagination.limit,
  //       total: response.pagination.total,
  //     });
  //   } catch (err: any) {
  //     setError(err.message || 'Failed to fetch category products');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }, []);

const getProducts = useCallback(async() => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await productService.getProducts();
      setProducts(response.data);
      setPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
      });
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products');
      return [];
    } finally {
      setIsLoading(false);
    } },[]);


  const getCategories = useCallback(async() => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await productService.getCategories();
      setCategories(response);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch categories');
      return [];
    } finally {
      setIsLoading(false);
    } }, []);


  return {
    products,
    categories,
    currentProduct,
    isLoading,
    error,
    pagination,
    fetchProducts,
    fetchProductById,
    // getProductsByCategory,
    getProducts,
    getCategories,
  };
};
