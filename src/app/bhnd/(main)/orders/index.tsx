import React, { useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useOrders } from '../../../../hooks/useOrders';
import { Header } from '../../../../components/common/Header';
import { OrderCard } from '../../../../components/order/OrderCard';
import { Loading } from '../../../../components/common/Loading';
import { EmptyState } from '../../../../components/common/EmptyState';

export default function OrdersScreen() {
  const { orders, isLoading, fetchOrders } = useOrders();

  useEffect(() => {
    fetchOrders();
  }, []);

  if (isLoading && orders.length === 0) {
    return <Loading />;
  }

  if (orders.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="Đơn hàng của tôi" />
        <View style={styles.emptyContainer}>
          <EmptyState
            title="Chưa có đơn đặt hàng"
            description="Bắt đầu mua sắm để tạo đơn hàng đầu tiên của bạn"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Đơn hàng của tôi" />

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              // Navigate to order detail
            }}
          >
            <OrderCard
              orderNumber={item.orderNumber}
              itemCount={item.items.length}
              total={item.total}
              status={item.status}
            />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  emptyContainer: {
    flex: 1,
  },
  listContent: {
    padding: 12,
  },
  item: {
    marginBottom: 12,
  },
});
