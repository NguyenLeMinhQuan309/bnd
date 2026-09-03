import React, { useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { useProducts } from '../../../../hooks/useProducts';
import { useCart } from '../../../../hooks/useCart';
import { Header } from '../../../../components/common/Header';
import { useNavigation } from '@react-navigation/native';
import { SearchBar } from '../../../../components/common/SearchBar';
import { ProductCard } from '../../../../components/product/ProductCard';
import { Loading } from '../../../../components/common/Loading';
import { EmptyState } from '../../../../components/common/EmptyState';

// Custom small icon built with Views to avoid external icon libraries
const FilterIcon = ({ size = 18, color = '#fff' }: { size?: number; color?: string }) => {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: size * 0.7, height: 2, backgroundColor: color, borderRadius: 1, marginBottom: 3 }} />
      <View style={{ width: size * 0.5, height: 2, backgroundColor: color, borderRadius: 1, marginBottom: 3 }} />
      <View style={{ width: size * 0.3, height: 2, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
};

const CloseIcon = ({ size = 18, color = '#666' }: { size?: number; color?: string }) => {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: size,
          height: 2,
          backgroundColor: color,
          borderRadius: 1,
          transform: [{ rotate: '45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size,
          height: 2,
          backgroundColor: color,
          borderRadius: 1,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  );
};

export default function HomeScreen() {
  const { products, categories, isLoading, error, getProducts, getCategories } = useProducts();
  const { addItem } = useCart();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [showFilterModal, setShowFilterModal] = React.useState(false);

  const safeProducts = Array.isArray(products) ? products : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  useEffect(() => {
    getProducts();
    getCategories();
  }, []);

  const handleSearch = React.useCallback((query: string) => {
    setSearchQuery(query);
    setIsSearching(query.trim().length > 0);
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await getProducts();
    setRefreshing(false);
  }, [getProducts]);

  const handleAddToCart = async (product: any) => {
    try {
      await addItem(
        product._id,
        1,
        product.prices?.[0]?.price || product.price || 0
      );
      Alert.alert('Thành công', `${product.name} đã được thêm vào giỏ hàng!`);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể thêm sản phẩm vào giỏ hàng');
    }
  };

  const toggleFilterModal = () => {
    setShowFilterModal((prev) => !prev);
  };

  if (isLoading && safeProducts.length === 0) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <Header title="Mua hàng" />

      <View style={styles.searchBarContainer}>
        <View style={{ flex: 1 }}>
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Tìm kiếm sản phẩm..."
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={toggleFilterModal} activeOpacity={0.85}>
          <FilterIcon size={16} color="#fff" />
          <Text style={styles.filterButtonText}>Bộ lọc</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={safeCategories}
        keyExtractor={(item, index) => item?._id || index.toString()}
        renderItem={({ item }) => {
          const categoryProducts = safeProducts
            .filter((p) => p?.categoryid?._id === item?._id)
            .slice(0, 6);

          if (categoryProducts.length === 0) {
            return null;
          }

          return (
            <View style={styles.categoryWrapper}>
              <View style={styles.categoryHeaderContainer}>
                <View style={styles.categoryHeaderBorder} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.categoryHeader} numberOfLines={1}>
                    {item?.name || 'Danh mục'}
                  </Text>
                  {!!item?.description && (
                    <Text style={styles.categorySubtext} numberOfLines={1}>
                      {item.description}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={() =>
                    navigation.navigate('product', {
                      categoryId: item?._id || '',
                      categoryName: item?.name || '',
                    })
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.moreButtonText}>Xem thêm</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.productItem}>
                {categoryProducts.map((p, index) => (
                  <View key={p?._id || `product-${index}`} style={styles.productCardWrapper}>
                    <ProductCard product={p} onAddToCart={handleAddToCart} />
                  </View>
                ))}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title={isSearching ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm'}
              description={isSearching ? 'Thử một từ khóa tìm kiếm khác' : 'Vui lòng quay lại sau'}
            />
          ) : null
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f10e0e" />}
        contentContainerStyle={styles.listContent}
      />

      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={toggleFilterModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={toggleFilterModal}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bộ lọc</Text>
              <TouchableOpacity onPress={toggleFilterModal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <CloseIcon size={16} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Nội dung bộ lọc sẽ được thêm ở đây */}
            <View style={styles.modalBody} />

            <TouchableOpacity style={styles.applyButton} onPress={toggleFilterModal} activeOpacity={0.85}>
              <Text style={styles.applyButtonText}>Áp dụng</Text>
            </TouchableOpacity>
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
    backgroundColor: '#FFE8E8',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  categoryWrapper: {
    marginBottom: 16,
    backgroundColor: '#fff',
    marginHorizontal: 14,
    borderRadius: 16,
    overflow: 'hidden',
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  categoryHeaderBorder: {
    width: 3,
    height: 20,
    backgroundColor: '#f10e0e',
    borderRadius: 2,
    marginRight: 10,
  },
  categoryHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  categorySubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  productItem: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  productCardWrapper: {
    width: '48%',
    marginBottom: 12,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f10e0e',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
    marginLeft: 10,
    shadowColor: '#f10e0e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  filterButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '700',
    fontSize: 13,
  },
  moreButton: {
    borderWidth: 1,
    borderColor: '#f10e0e',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginLeft: 10,
  },
  moreButtonText: {
    color: '#f10e0e',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 220,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
  },
  modalBody: {
    flex: 1,
  },
  applyButton: {
    backgroundColor: '#f10e0e',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  applyButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 15,
  },
});