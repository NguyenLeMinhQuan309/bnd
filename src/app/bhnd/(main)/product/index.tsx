import React, { useEffect, useMemo, useState, useCallback, memo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useProducts } from '../../../../hooks/useProducts';
import { Header } from '../../../../components/common/Header';
import { ProductCard } from '../../../../components/product/ProductCard';
import { ProductList } from '../../../../components/product/ProductList';
import { Loading } from '../../../../components/common/Loading';
import { EmptyState } from '../../../../components/common/EmptyState';
import { useLocalSearchParams } from 'expo-router';
import { useRoute } from '@react-navigation/native';

const ProductListRow = memo(function ProductListRow({
  item,
  viewMode,
  onAddToCart,
}: {
  item: any;
  viewMode: 'card' | 'list';
  onAddToCart: (productId?: string) => void;
}) {
  return (
    <View style={viewMode === 'card' ? styles.cardWrapper : styles.listWrapper}>
      {viewMode === 'card' ? (
        <ProductCard product={item} onAddToCart={() => onAddToCart(item?._id)} />
      ) : (
        <ProductList product={item} onAddToCart={() => onAddToCart(item?._id)} />
      )}
    </View>
  );
});

export default function ProductScreen() {
  const { products, categories, isLoading, error, getProducts, getCategories } = useProducts();
  const params = useLocalSearchParams<{ categoryId?: string | string[]; categoryName?: string | string[] }>();
  const route = useRoute<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  const safeProducts = Array.isArray(products) ? products : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  useEffect(() => {
    void getProducts();
    void getCategories();
  }, [getCategories, getProducts]);

  useEffect(() => {
    const categoryIdFromQuery = Array.isArray(params.categoryId) ? params.categoryId[0] : params.categoryId;
    const categoryIdFromRoute = Array.isArray(route?.params?.categoryId)
      ? route.params.categoryId[0]
      : route?.params?.categoryId;
    setSelectedCategoryId(categoryIdFromRoute || categoryIdFromQuery || null);
  }, [params.categoryId, route?.params?.categoryId]);

  const selectedCategoryLabel = useMemo(() => {
    if (!selectedCategoryId) {
      return 'Tất cả danh mục';
    }

    const matchedCategory = safeCategories.find((category) => category?._id === selectedCategoryId);
    if (matchedCategory?.name) {
      return matchedCategory.name;
    }

    const categoryNameFromQuery = Array.isArray(params.categoryName) ? params.categoryName[0] : params.categoryName;
    const categoryNameFromRoute = Array.isArray(route?.params?.categoryName)
      ? route.params.categoryName[0]
      : route?.params?.categoryName;
    return categoryNameFromRoute || categoryNameFromQuery || 'Danh mục';
  }, [params.categoryName, route?.params?.categoryName, safeCategories, selectedCategoryId]);

  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId) {
      return safeProducts;
    }

    return safeProducts.filter((product) => {
      const categoryId = product?.categoryid?._id || product?.category?._id;
      return categoryId === selectedCategoryId;
    });
  }, [safeProducts, selectedCategoryId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await getProducts();
    await getCategories();
    setRefreshing(false);
  }, [getProducts, getCategories]);

  const handleAddToCart = useCallback((_productId?: string) => {
    return undefined;
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <ProductListRow item={item} viewMode={viewMode} onAddToCart={handleAddToCart} />
    ),
    [viewMode, handleAddToCart]
  );

  if (isLoading && safeProducts.length === 0) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <Header title="Sản phẩm" />

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.combobox}
          onPress={() => setShowCategoryMenu(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="pricetag-outline" size={14} color="#f10e0e" style={{ marginRight: 6 }} />
          <Text style={styles.comboboxText} numberOfLines={1}>
            {selectedCategoryLabel}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#999" />
        </TouchableOpacity>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'card' && styles.toggleButtonActive]}
            onPress={() => setViewMode('card')}
            activeOpacity={0.8}
          >
            <Ionicons name="grid" size={16} color={viewMode === 'card' ? '#fff' : '#888'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
            onPress={() => setViewMode('list')}
            activeOpacity={0.8}
          >
            <Ionicons name="list" size={16} color={viewMode === 'list' ? '#fff' : '#888'} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        key={viewMode}
        data={filteredProducts}
        keyExtractor={(item, index) => item?._id || `product-${index}`}
        numColumns={viewMode === 'card' ? 2 : 1}
        columnWrapperStyle={viewMode === 'card' ? styles.row : undefined}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f10e0e" />}
        renderItem={renderItem}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title="Không có sản phẩm"
              description="Hãy quay lại sau để xem thêm sản phẩm mới"
            />
          ) : null
        }
      />

      <Modal
        visible={showCategoryMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryMenu(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCategoryMenu(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Chọn danh mục</Text>
              <TouchableOpacity onPress={() => setShowCategoryMenu(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.optionItem, !selectedCategoryId && styles.optionItemActive]}
              onPress={() => {
                setSelectedCategoryId(null);
                setShowCategoryMenu(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionText, !selectedCategoryId && styles.optionTextActive]}>Tất cả</Text>
              {!selectedCategoryId && <Ionicons name="checkmark" size={18} color="#f10e0e" />}
            </TouchableOpacity>

            {safeCategories.map((category) => {
              const isActive = selectedCategoryId === category?._id;
              return (
                <TouchableOpacity
                  key={category?._id || category?.name}
                  style={[styles.optionItem, isActive && styles.optionItemActive]}
                  onPress={() => {
                    setSelectedCategoryId(category?._id || null);
                    setShowCategoryMenu(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                    {category?.name || 'Danh mục'}
                  </Text>
                  {isActive && <Ionicons name="checkmark" size={18} color="#f10e0e" />}
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  errorContainer: {
    marginHorizontal: 14,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFE8E8',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  combobox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 24,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  comboboxText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#eceef0',
    padding: 3,
    borderRadius: 10,
  },
  toggleButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#f10e0e',
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardWrapper: {
    width: '48%',
    marginBottom: 14,
  },
  listWrapper: {
    width: '100%',
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalCard: {
    width: '100%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0e0e0',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  optionItemActive: {
    backgroundColor: '#fce8e8',
  },
  optionText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#f10e0e',
    fontWeight: '700',
  },
});