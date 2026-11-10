import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOrders } from "../../../hooks/useOrders";
import { useResponsive } from "../../../hooks/useResponsive";
import { orderService } from "../../../services/orderService";
import { Header } from "../../../components/common/Header";
import { Loading } from "../../../components/common/Loading";
import { EmptyState } from "../../../components/common/EmptyState";
import { formatPrice } from "../../../utils/formatting";
import {
  getEffectiveOrderStatus,
  getOrderStatusInfo,
} from "../../../components/order/OrderCard";
import { getProductImageUrl } from "../../../services/imageService";
import { theme } from "@/src/styles/theme";

const BackIcon = () => {
  const r = useResponsive();
  return (
    <Ionicons name="arrow-back" size={r.ms(24)} color={theme.colors.text} />
  );
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const r = useResponsive();
  const isWide = r.width >= 900; // tablet ngang / màn rộng: chia 2 cột
  const styles = useMemo(
    () => createStyles(r, insets, isWide),
    [r.width, r.height, insets.bottom, insets.left, insets.right, isWide],
  );

  const { currentOrder, isLoading, error, fetchOrderById } = useOrders();

  useEffect(() => {
    if (id) {
      fetchOrderById(id);
    }
  }, [id, fetchOrderById]);

  if (isLoading && !currentOrder) {
    return (
      <View style={styles.container}>
        <Header
          title="Chi tiết đơn hàng"
          leftIcon={<BackIcon />}
          onLeftPress={() => router.back()}
        />
        <Loading />
      </View>
    );
  }

  if (!currentOrder || error) {
    return (
      <View style={styles.container}>
        <Header
          title="Chi tiết đơn hàng"
          leftIcon={<BackIcon />}
          onLeftPress={() => router.back()}
        />
        <View style={styles.emptyContainer}>
          <EmptyState
            title="Không tìm thấy đơn hàng"
            description="Đơn hàng có thể đã bị xoá hoặc không tồn tại"
          />
        </View>
      </View>
    );
  }

  const order = currentOrder;
  const currentStatus = getEffectiveOrderStatus(order);
  const statusInfo = getOrderStatusInfo(order);
  const formatDate = (date?: string) =>
    date ? new Date(date).toLocaleDateString("vi-VN") : "Chưa cập nhật";
  const currentMilestone =
    currentStatus === "delivered" ? 2 : currentStatus === "pending" ? 0 : 1;
  const deliveryRequest = order.deliveryRequest;
  const deliveryConfirmation = order.deliveryConfirmation;
  const customerRequestDescription = deliveryRequest
    ? [
        `Địa chỉ giao: ${deliveryRequest.deliveryAddress || "Chưa cập nhật"}`,
        `Ngày mong muốn: ${formatDate(deliveryRequest.desiredDate)} - ${deliveryRequest.desiredTimeSlot || "Chưa chọn"}`,
        `Đá: ${deliveryRequest.hasIce ? "Có" : "Không"}, Thùng xốp: ${deliveryRequest.hasStyrofoamBox ? "Có" : "Không"}`,
        deliveryRequest.note ? `Ghi chú: ${deliveryRequest.note}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "Khách không có yêu cầu đặc biệt";
  const adminConfirmationComplete =
    deliveryConfirmation?.status === "confirmed" ||
    deliveryConfirmation?.status === "changed";

  // ----- Tiền: tiền hàng + phí ship + thùng xốp -----
  const shippingFee = deliveryConfirmation?.shippingFee || 0;
  const boxes = deliveryConfirmation?.styrofoamBox || [];
  const boxFee = boxes.reduce(
    (sum, b) => sum + (b.unitPrice || 0) * (b.quantity || 0),
    0,
  );
  const goodsTotal =
    order.isSplit && order.totalSplit != null ? order.totalSplit : order.total;
  // payable = 0 hoặc undefined với đơn cũ → tính lại
  const payableTotal = order.payable || goodsTotal + shippingFee + boxFee;

  const adminConfirmationDescription = adminConfirmationComplete
    ? [
        deliveryConfirmation.status === "confirmed"
          ? "Đã xác nhận đúng yêu cầu"
          : "Đã chốt lịch khác yêu cầu",
        `Ngày giao: ${formatDate(deliveryConfirmation.confirmedDate)} - ${deliveryConfirmation.confirmedTimeSlot || "Chưa cập nhật"}`,
        shippingFee > 0 ? `Phí ship: ${formatPrice(shippingFee)}` : "",
        ...boxes.map(
          (b) => `Thùng xốp: ${b.name || "Thùng xốp"} x${b.quantity}`,
        ),
        deliveryConfirmation.confirmationNote
          ? `Ghi chú admin: ${deliveryConfirmation.confirmationNote}`
          : "",
        deliveryConfirmation.confirmedByName
          ? `Xác nhận bởi: ${deliveryConfirmation.confirmedByName}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "Người bán hàng chưa xác nhận lịch giao hàng";

  const milestones = [
    {
      title: "Chờ xác nhận",
      description: customerRequestDescription,
    },
    {
      title: "Đã xác nhận",
      description: adminConfirmationDescription,
    },
    {
      title: "Đã giao",
      description:
        currentStatus === "delivered"
          ? `Đơn hàng #${order.orderId} đã được giao thành công`
          : "Xin vui lòng chờ giao hàng",
    },
  ];

  const handleCancelOrder = () => {
    Alert.alert("Huỷ đơn hàng", "Bạn có chắc muốn huỷ đơn này không?", [
      { text: "Không", style: "cancel" },
      {
        text: "Huỷ đơn",
        style: "destructive",
        onPress: async () => {
          try {
            await orderService.cancelOrder(order._id, order.customerCode);
            await fetchOrderById(order._id); // load lại để cập nhật trạng thái mới
          } catch (err: any) {
            Alert.alert(
              "Lỗi",
              err?.message || "Không thể huỷ đơn, vui lòng thử lại.",
            );
          }
        },
      },
    ]);
  };

  // ---------- Các khối giao diện: dựng một lần, bố trí 1 hoặc 2 cột ở dưới ----------

  const statusCard = (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
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
      <Text style={styles.dateText} maxFontSizeMultiplier={1.3}>
        Đặt lúc {new Date(order.orderDate).toLocaleString("vi-VN")}
      </Text>
      {order.isSplit && (
        <View style={styles.splitTag}>
          <Text style={styles.splitTagText} maxFontSizeMultiplier={1.3}>
            Đơn tách từ #{order.parentOrderId}
          </Text>
        </View>
      )}
    </View>
  );

  const productsCard = (
    <View style={styles.card}>
      <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>
        Sản phẩm ({order.items.length})
      </Text>
      {order.items.map((item, index) => (
        <View
          key={`${item.id?.id || item.productId}-${index}`}
          style={[
            styles.itemRow,
            index === order.items.length - 1 && styles.itemRowLast,
          ]}
        >
          <Image
            source={{ uri: getProductImageUrl(item.id?.id || "") }}
            style={styles.itemImage}
            resizeMode="cover"
          />
          <View style={styles.itemInfo}>
            <Text
              style={styles.itemName}
              numberOfLines={2}
              maxFontSizeMultiplier={1.2}
            >
              {item.id?.name || item.productName}
            </Text>
            {!!item.id?.specifications && (
              <Text
                style={styles.itemSpecs}
                numberOfLines={1}
                maxFontSizeMultiplier={1.2}
              >
                {item.id?.specifications}
              </Text>
            )}
            <View style={styles.itemFooter}>
              <Text style={styles.itemQty} maxFontSizeMultiplier={1.3}>
                x{item.quantity}
              </Text>
              <Text
                style={styles.itemPrice}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                maxFontSizeMultiplier={1.2}
              >
                {formatPrice(item.totalPrice)}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const milestonesCard = (
    <View style={styles.card}>
      <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>
        Trạng thái đơn hàng
      </Text>
      {currentStatus === "cancelled" ? (
        <View style={styles.cancelledMilestone}>
          <View style={styles.cancelledDot}>
            <Ionicons
              name="close"
              size={r.ms(14)}
              color={theme.colors.onPrimary}
            />
          </View>
          <View style={styles.milestoneContent}>
            <Text style={styles.cancelledTitle} maxFontSizeMultiplier={1.3}>
              Đã huỷ
            </Text>
            <Text
              style={styles.milestoneDescription}
              maxFontSizeMultiplier={1.3}
            >
              {order.deliveryConfirmation?.status === "cancelled"
                ? "Người bán hàng đã từ chối yêu cầu. Lý do: " +
                  (order.deliveryConfirmation?.confirmationNote ||
                    "Không có thông tin")
                : `Đơn hàng ${order.orderId} đã bị huỷ`}
            </Text>
          </View>
        </View>
      ) : (
        milestones.map((milestone, index) => {
          const isCompleted = index < currentMilestone;
          const isCurrent = index === currentMilestone;

          return (
            <View style={styles.milestoneRow} key={milestone.title}>
              <View style={styles.milestoneRail}>
                <View
                  style={[
                    styles.milestoneDot,
                    (isCompleted || isCurrent) && styles.activeMilestoneDot,
                  ]}
                >
                  {(isCompleted || isCurrent) && (
                    <Ionicons
                      name="checkmark"
                      size={r.ms(13)}
                      color={theme.colors.onPrimary}
                    />
                  )}
                </View>
                {index < milestones.length - 1 && (
                  <View
                    style={[
                      styles.milestoneLine,
                      isCompleted && styles.activeMilestoneLine,
                    ]}
                  />
                )}
              </View>
              <View style={styles.milestoneContent}>
                <Text
                  style={[
                    styles.milestoneTitle,
                    (isCompleted || isCurrent) && styles.activeMilestoneTitle,
                  ]}
                  maxFontSizeMultiplier={1.3}
                >
                  {milestone.title}
                </Text>
                <Text
                  style={styles.milestoneDescription}
                  maxFontSizeMultiplier={1.3}
                >
                  {milestone.description}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  const receiverCard = (
    <View style={styles.card}>
      <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>
        Thông tin người nhận
      </Text>
      <View style={styles.infoRow}>
        <Ionicons
          name="person-outline"
          size={r.ms(16)}
          color={theme.colors.primary}
          style={styles.infoIcon}
        />
        <Text style={styles.infoText} maxFontSizeMultiplier={1.3}>
          {order.customerName}
        </Text>
      </View>
      {!!order.address && (
        <View style={styles.infoRow}>
          <Ionicons
            name="location-outline"
            size={r.ms(16)}
            color={theme.colors.primary}
            style={styles.infoIcon}
          />
          <Text style={styles.infoText} maxFontSizeMultiplier={1.3}>
            {order.address}
          </Text>
        </View>
      )}
      {!!order.notes && (
        <View style={styles.infoRow}>
          <Ionicons
            name="document-text-outline"
            size={r.ms(16)}
            color={theme.colors.primary}
            style={styles.infoIcon}
          />
          <Text style={styles.infoText} maxFontSizeMultiplier={1.3}>
            {order.notes}
          </Text>
        </View>
      )}
    </View>
  );

  const paymentCard = (
    <View style={styles.card}>
      <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>
        Thanh toán
      </Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel} maxFontSizeMultiplier={1.3}>
          Phương thức
        </Text>
        <Text style={styles.summaryValue} maxFontSizeMultiplier={1.3}>
          {order.paymentMethod || "Chưa xác định"}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel} maxFontSizeMultiplier={1.3}>
          Trạng thái thanh toán
        </Text>
        <Text style={styles.summaryValue} maxFontSizeMultiplier={1.3}>
          {order.paymentStatus === "completed"
            ? "Đã thanh toán"
            : order.paymentStatus === "failed"
              ? "Lỗi thanh toán"
              : "Chưa thanh toán"}
        </Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel} maxFontSizeMultiplier={1.3}>
          Tiền hàng
        </Text>
        <Text style={styles.summaryValue} maxFontSizeMultiplier={1.3}>
          {formatPrice(goodsTotal)}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel} maxFontSizeMultiplier={1.3}>
          Phí ship
        </Text>
        <Text style={styles.summaryValue} maxFontSizeMultiplier={1.3}>
          {adminConfirmationComplete
            ? formatPrice(shippingFee)
            : "Chờ xác nhận"}
        </Text>
      </View>
      {boxFee > 0 && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel} maxFontSizeMultiplier={1.3}>
            Thùng xốp
          </Text>
          <Text style={styles.summaryValue} maxFontSizeMultiplier={1.3}>
            {formatPrice(boxFee)}
          </Text>
        </View>
      )}
      <View style={styles.divider} />
      <View style={styles.summaryRow}>
        <Text style={styles.totalLabel} maxFontSizeMultiplier={1.2}>
          {adminConfirmationComplete ? "Tổng thanh toán" : "Tạm tính"}
        </Text>
        <Text
          style={styles.totalValue}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          maxFontSizeMultiplier={1.2}
        >
          {formatPrice(payableTotal)}
        </Text>
      </View>
    </View>
  );

  // Huỷ đơn — chỉ hiện khi đơn còn ở bước sớm nhất (khách tự đặt qua app)
  const cancelButton =
    order.orderStatus === "confirmed" || order.orderStatus === "pending" ? (
      <TouchableOpacity
        style={styles.cancelButton}
        activeOpacity={0.85}
        onPress={handleCancelOrder}
      >
        <Text style={styles.cancelButtonText} maxFontSizeMultiplier={1.2}>
          Huỷ đơn hàng
        </Text>
      </TouchableOpacity>
    ) : null;

  return (
    <View style={styles.container}>
      <Header
        title="Chi tiết đơn hàng"
        leftIcon={<BackIcon />}
        onLeftPress={() => router.navigate("/bhnd/(main)/orders")}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isWide ? (
          // Màn rộng: trái là đơn + sản phẩm, phải là trạng thái + người nhận + thanh toán
          <View style={styles.columns}>
            <View style={styles.colLeft}>
              {statusCard}
              {productsCard}
            </View>
            <View style={styles.colRight}>
              {milestonesCard}
              {receiverCard}
              {paymentCard}
              {cancelButton}
            </View>
          </View>
        ) : (
          // Điện thoại / tablet dọc: một cột, tablet giới hạn bề rộng và căn giữa
          <View style={styles.singleColumn}>
            {statusCard}
            {productsCard}
            {milestonesCard}
            {receiverCard}
            {paymentCard}
            {cancelButton}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (
  r: ReturnType<typeof useResponsive>,
  insets: { bottom: number; left: number; right: number },
  isWide: boolean,
) => {
  const pad = r.ms(16);
  const dot = Math.round(r.ms(22));

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    emptyContainer: { flex: 1 },
    scrollContent: {
      paddingTop: pad,
      // Thay marginBottom: 20 của container: chừa đúng vùng an toàn phía dưới
      paddingBottom: insets.bottom + r.ms(32),
      paddingLeft: insets.left + pad,
      paddingRight: insets.right + pad,
      alignItems: "center", // căn giữa khối nội dung khi có maxWidth
    },
    singleColumn: {
      width: "100%",
      maxWidth: 720,
    },
    columns: {
      width: "100%",
      maxWidth: 1100,
      flexDirection: "row",
      alignItems: "flex-start", // hai cột cao độc lập nhau
      gap: r.ms(14),
    },
    colLeft: { flex: 1.1 },
    colRight: { flex: 1 },

    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: r.ms(16),
      marginBottom: r.ms(14),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...theme.shadow.card,
    },
    rowBetween: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    orderId: {
      flex: 1,
      marginRight: r.ms(8),
      fontSize: r.font(18),
      fontWeight: "800",
      color: theme.colors.text,
    },
    statusBadge: {
      flexShrink: 0,
      paddingVertical: r.ms(5),
      paddingHorizontal: r.ms(12),
      borderRadius: theme.radius.pill,
    },
    statusText: { fontSize: r.font(12), fontWeight: "700" },
    dateText: {
      fontSize: r.font(13),
      color: theme.colors.textSecondary,
      marginTop: r.ms(6),
    },
    splitTag: {
      marginTop: r.ms(8),
      alignSelf: "flex-start",
      backgroundColor: theme.colors.primarySoft,
      paddingVertical: r.ms(4),
      paddingHorizontal: r.ms(10),
      borderRadius: theme.radius.xs,
    },
    splitTagText: {
      fontSize: r.font(12),
      color: theme.colors.primary,
      fontWeight: "600",
    },
    sectionTitle: {
      fontSize: r.font(15),
      fontWeight: "800",
      color: theme.colors.text,
      marginBottom: r.ms(14),
    },

    // ---------- Sản phẩm ----------
    itemRow: {
      flexDirection: "row",
      paddingBottom: r.ms(12),
      marginBottom: r.ms(12),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    itemRowLast: { marginBottom: 0, paddingBottom: 0, borderBottomWidth: 0 },
    itemImage: {
      width: Math.round(r.ms(72)),
      height: Math.round(r.ms(72)),
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surfaceMuted,
      marginRight: r.ms(12),
    },
    itemInfo: { flex: 1 },
    itemName: {
      fontSize: r.font(14),
      fontWeight: "700",
      color: theme.colors.text,
    },
    itemSpecs: {
      fontSize: r.font(12),
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    itemFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: r.ms(8),
    },
    itemQty: { fontSize: r.font(13), color: theme.colors.textSecondary },
    itemPrice: {
      flexShrink: 1,
      marginLeft: r.ms(8),
      fontSize: r.font(14),
      fontWeight: "800",
      color: theme.colors.primary,
    },

    // ---------- Cột mốc ----------
    milestoneRow: { flexDirection: "row", minHeight: r.ms(56) },
    milestoneRail: {
      width: dot + 2,
      alignItems: "center",
    },
    milestoneDot: {
      width: dot,
      height: dot,
      borderRadius: dot / 2,
      backgroundColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    activeMilestoneDot: { backgroundColor: theme.colors.success },
    milestoneLine: {
      width: 2,
      flex: 1,
      minHeight: r.ms(30),
      backgroundColor: theme.colors.border,
    },
    activeMilestoneLine: { backgroundColor: theme.colors.success },
    milestoneContent: {
      flex: 1,
      paddingLeft: r.ms(12),
      paddingBottom: r.ms(14),
    },
    milestoneTitle: {
      fontSize: r.font(14),
      fontWeight: "600",
      color: theme.colors.textMuted,
    },
    activeMilestoneTitle: { color: theme.colors.success, fontWeight: "700" },
    milestoneDescription: {
      fontSize: r.font(12),
      lineHeight: Math.round(r.font(12) * 1.5),
      color: theme.colors.textSecondary,
      marginTop: 3,
    },
    cancelledMilestone: { flexDirection: "row", minHeight: r.ms(56) },
    cancelledDot: {
      width: dot,
      height: dot,
      borderRadius: dot / 2,
      backgroundColor: theme.colors.danger,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelledTitle: {
      fontSize: r.font(14),
      fontWeight: "700",
      color: theme.colors.danger,
    },

    // ---------- Người nhận ----------
    infoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: r.ms(10),
    },
    infoIcon: { marginTop: 2, marginRight: r.ms(10) },
    infoText: { fontSize: r.font(14), color: theme.colors.text, flex: 1 },

    // ---------- Thanh toán ----------
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: r.ms(10),
    },
    summaryLabel: {
      flexShrink: 1,
      marginRight: r.ms(12),
      fontSize: r.font(14),
      color: theme.colors.textSecondary,
    },
    summaryValue: {
      flexShrink: 1,
      textAlign: "right",
      fontSize: r.font(14),
      fontWeight: "600",
      color: theme.colors.text,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
      marginVertical: 6,
      marginBottom: r.ms(12),
    },
    totalLabel: {
      fontSize: r.font(16),
      fontWeight: "700",
      color: theme.colors.text,
    },
    totalValue: {
      flexShrink: 1,
      marginLeft: r.ms(8),
      fontSize: r.font(20),
      fontWeight: "800",
      color: theme.colors.danger,
    },

    cancelButton: {
      borderWidth: 1,
      borderColor: theme.colors.danger,
      backgroundColor: theme.colors.dangerBg,
      borderRadius: theme.radius.md,
      paddingVertical: r.ms(14),
      minHeight: 48,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 4,
    },
    cancelButtonText: {
      color: theme.colors.danger,
      fontSize: r.font(14),
      fontWeight: "700",
    },
  });
};
