import React, { useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCart } from '../../../../hooks/useCart';
import { Header } from '../../../../components/common/Header';
import { CartItemComponent } from '../../../../components/cart/CartItem';
import { Loading } from '../../../../components/common/Loading';
import { EmptyState } from '../../../../components/common/EmptyState';
import { Button } from '../../../../components/common/Button';
import { formatPrice } from '../../../../utils/formatting';

export default function CartScreen() {
  const {
    items,
    total,
    subtotal,
    shippingCost,
    discount,
    removeItem,
    updateQuantity,
    isLoading,
    fetchCart,
  } = useCart();
  const [refreshing, setRefreshing] = React.useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  }, [fetchCart]);

  if (isLoading && items.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="Giỏ hàng" />
        <Loading />
      </View>
    );
  }

  if (!items || items.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="Giỏ hàng" />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cart-outline" size={40} color="#f10e0e" />
          </View>
          <EmptyState
            title="Giỏ hàng trống"
            description="Thêm sản phẩm để bắt đầu mua sắm"
          />
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/')}
            activeOpacity={0.85}
          >
            <Text style={styles.shopButtonText}>Tiếp tục mua sắm</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Giỏ hàng" />

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <CartItemComponent
              item={item}
              onQuantityChange={(quantity) => updateQuantity(item._id, quantity)}
              onRemove={() => removeItem(item._id)}
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f10e0e" />}
      />

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tổng tiền hàng</Text>
          <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tiền ship</Text>
          <Text style={styles.summaryValue}>{formatPrice(shippingCost)}</Text>
        </View>

        {discount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Giảm giá</Text>
            <Text style={[styles.summaryValue, styles.discountValue]}>
              {formatPrice(-discount)}
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Tổng tiền</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>

        <Button label="Đặt hàng" onPress={() => {}} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#fce8e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  shopButton: {
    backgroundColor: '#f10e0e',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    marginTop: 20,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    padding: 14,
    paddingBottom: 4,
  },
  item: {
    marginBottom: 14,
  },
  summary: {
    backgroundColor: '#fff',
    padding: 18,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#777',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  discountValue: {
    color: '#34C759',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f10e0e',
  },
});