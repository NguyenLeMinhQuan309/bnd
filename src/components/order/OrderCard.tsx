import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Order, OrderStatus } from "../../types";
import { formatPrice } from "../../utils/formatting";
import { Colors } from "../../styles/colors";
import { useResponsive } from "../../hooks/useResponsive";

interface OrderCardProps {
  order: Order;
}

export const getEffectiveOrderStatus = (order: Order): OrderStatus => {
  if (order.paymentStatus === "completed") return "delivered";
  if (order.orderStatus) {
    return order.orderStatus;
  }
  return "pending";
};

// Số tiền khách phải trả: tiền hàng + phí ship + thùng xốp.
// payable = 0 hoặc undefined với đơn cũ và đơn tách → tính lại từ các thành phần.
export const getOrderPayable = (order: Order): number => {
  if (order.payable) return order.payable;

  const goods =
    order.isSplit && order.totalSplit != null ? order.totalSplit : order.total;
  const ship = order.deliveryConfirmation?.shippingFee || 0;
  const boxFee = (order.deliveryConfirmation?.styrofoamBox || []).reduce(
    (sum, b) => sum + (b.unitPrice || 0) * (b.quantity || 0),
    0,
  );
  return (goods || 0) + ship + boxFee;
};

export const getOrderStatusInfo = (
  order: Order,
): { label: string; color: string; bg: string } => {
  const status = getEffectiveOrderStatus(order);

  switch (status) {
    case "pending":
      return { label: "Chờ xác nhận", color: "#666", bg: "#F0F0F0" };
    case "confirmed":
      return { label: "Đã xác nhận", color: "#1565C0", bg: "#E3F2FD" };
    case "preparing":
      return { label: "Đang chuẩn bị", color: "#1E8E3E", bg: "#FEF3E0" };
    case "shipping":
      return { label: "Đang giao", color: "#B87503", bg: "#FEF3E0" };
    case "delivered":
      return { label: "Đã giao", color: "#1E8E3E", bg: "#E6F4EA" };
    case "cancelled":
      return { label: "Đã huỷ", color: "#999", bg: "#F0F0F0" };
  }
};

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const r = useResponsive();
  const styles = useMemo(() => createStyles(r), [r.width, r.height]);

  const statusInfo = getOrderStatusInfo(order);
  const itemCount = order.items?.length || 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        {/* flex: 1 + numberOfLines: mã đơn dài không đè lên badge trạng thái */}
        <Text
          style={styles.orderId}
          numberOfLines={1}
          maxFontSizeMultiplier={1.2}
        >
          #{order.orderId}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
          <Text
            style={[styles.statusText, { color: statusInfo.color }]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
          >
            {statusInfo.label}
          </Text>
        </View>
      </View>

      <Text style={styles.itemCount} maxFontSizeMultiplier={1.3}>
        {itemCount} sản phẩm
        {order.isSplit ? " · Đơn tách" : ""}
      </Text>

      <View style={styles.footerRow}>
        <Text style={styles.dateText} maxFontSizeMultiplier={1.3}>
          {new Date(order.orderDate).toLocaleDateString("vi-VN")}
        </Text>
        <Text
          style={styles.total}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          maxFontSizeMultiplier={1.2}
        >
          {formatPrice(getOrderPayable(order))}
        </Text>
      </View>
    </View>
  );
};

const createStyles = (r: ReturnType<typeof useResponsive>) =>
  StyleSheet.create({
    card: {
      backgroundColor: Colors.bgPrimary,
      borderRadius: 14,
      padding: r.ms(14),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: r.ms(6),
    },
    orderId: {
      flex: 1,
      marginRight: r.ms(8),
      fontSize: r.font(15),
      fontWeight: "700",
      color: "#222",
    },
    statusBadge: {
      flexShrink: 0,
      paddingVertical: r.ms(4),
      paddingHorizontal: r.ms(10),
      borderRadius: 12,
    },
    statusText: {
      fontSize: r.font(12),
      fontWeight: "700",
    },
    itemCount: {
      fontSize: r.font(13),
      color: "#777",
      marginBottom: r.ms(10),
    },
    footerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: "#f2f2f2",
      paddingTop: r.ms(10),
    },
    dateText: {
      fontSize: r.font(12),
      color: "#999",
    },
    total: {
      flexShrink: 1,
      marginLeft: r.ms(8),
      fontSize: r.font(16),
      fontWeight: "800",
      color: "#f10e0e",
    },
  });
