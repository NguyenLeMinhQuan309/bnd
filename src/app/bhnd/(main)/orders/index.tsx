import React, { useEffect, useCallback, useState, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Text,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOrders } from "../../../../hooks/useOrders";
import { useResponsive } from "../../../../hooks/useResponsive";
import { Header } from "../../../../components/common/Header";
import {
  OrderCard,
  getEffectiveOrderStatus,
} from "../../../../components/order/OrderCard";
import { Loading } from "../../../../components/common/Loading";
import { EmptyState } from "../../../../components/common/EmptyState";
import { OrderStatus } from "../../../../types";
import { theme } from "@/src/styles/theme";

type TabKey = "all" | OrderStatus;

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ xác nhận" },
  { key: "confirmed", label: "Đã xác nhận" },
  { key: "preparing", label: "Đang chuẩn bị" },
  { key: "shipping", label: "Đang giao" },
  { key: "delivered", label: "Đã giao" },
  { key: "cancelled", label: "Đã huỷ" },
];

// Điện thoại: 1 cột. Tablet dọc: 2 cột. Màn rộng / xoay ngang tablet: 3 cột
const getColumns = (width: number) =>
  width >= 1300 ? 3 : width >= 640 ? 2 : 1;

export default function OrdersScreen() {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const numColumns = getColumns(r.width);
  const styles = useMemo(
    () => createStyles(r, insets, numColumns),
    [r.width, r.height, insets.left, insets.right, insets.bottom, numColumns],
  );

  const { orders, isLoading, fetchOrders } = useOrders();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  // Đếm số đơn theo từng trạng thái — hiện số lượng trên tab
  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    orders.forEach((order) => {
      const status = getEffectiveOrderStatus(order);
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders;
    return orders.filter(
      (order) => getEffectiveOrderStatus(order) === activeTab,
    );
  }, [orders, activeTab]);

  if (isLoading && orders.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="Đơn hàng của tôi" />
        <Loading />
      </View>
    );
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

      <View style={styles.tabBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
        >
          {TABS.map((tab) => {
            const count = countByStatus[tab.key] || 0;
            // Ẩn tab trạng thái nào không có đơn nào — trừ "Tất cả" luôn hiện
            if (tab.key !== "all" && count === 0) return null;

            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabChip, isActive && styles.tabChipActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    isActive && styles.tabChipTextActive,
                  ]}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.2}
                >
                  {tab.label}
                  {tab.key !== "all" ? ` (${count})` : ""}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            title="Không có đơn nào"
            description="Chưa có đơn hàng nào ở trạng thái này"
          />
        </View>
      ) : (
        <FlatList
          // Đổi số cột lúc chạy (xoay màn hình) bắt buộc phải đổi key
          key={`cols-${numColumns}`}
          data={filteredOrders}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              activeOpacity={0.85}
              onPress={() => router.push(`/bhnd/order/${item._id}`)}
            >
              <OrderCard order={item} />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const createStyles = (
  r: ReturnType<typeof useResponsive>,
  insets: { left: number; right: number; bottom: number },
  numColumns: number,
) => {
  const pad = r.ms(16);
  const gap = r.ms(12);

  // Bề rộng vùng nội dung (có trần cho màn hình rất rộng) và bề rộng mỗi thẻ
  const contentWidth = Math.min(
    r.width - insets.left - insets.right - pad * 2,
    1100,
  );
  const cardWidth = Math.floor(
    (contentWidth - gap * (numColumns - 1)) / numColumns,
  );

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    emptyContainer: {
      flex: 1,
    },
    // Thanh lọc trạng thái nằm trên nền trang, không còn dải trắng + đường kẻ
    tabBarWrapper: {
      backgroundColor: theme.colors.background,
    },
    tabBar: {
      paddingLeft: insets.left + pad,
      paddingRight: insets.right + pad,
      paddingVertical: r.ms(10),
      gap: r.ms(8),
    },
    tabChip: {
      paddingVertical: r.ms(8),
      paddingHorizontal: r.ms(16),
      minHeight: 36,
      justifyContent: "center",
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    tabChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    tabChipText: {
      fontSize: r.font(13),
      fontWeight: "600",
      color: theme.colors.textSecondary,
    },
    tabChipTextActive: {
      color: theme.colors.onPrimary,
    },
    listContent: {
      paddingTop: r.ms(6),
      paddingBottom: insets.bottom + pad,
      paddingLeft: insets.left + pad,
      paddingRight: insets.right + pad,
      alignItems: "center", // căn giữa khối lưới khi có maxWidth
    },
    columnWrapper: {
      gap,
    },
    item: {
      width: cardWidth,
      marginBottom: gap,
    },
  });
};
