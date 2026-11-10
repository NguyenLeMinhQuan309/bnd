import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../../../../hooks/useCart";
import { useAuth } from "../../../../hooks/useAuth";
import { useResponsive } from "../../../../hooks/useResponsive";
import { orderService } from "../../../../services/orderService";
import { Header } from "../../../../components/common/Header";
import { CartItemComponent } from "../../../../components/cart/CartItem";
import { Loading } from "../../../../components/common/Loading";
import { EmptyState } from "../../../../components/common/EmptyState";
import { Button } from "../../../../components/common/Button";
import { formatPrice } from "../../../../utils/formatting";
import { theme } from "@/src/styles/theme";

type Styles = ReturnType<typeof createStyles>;

// Nhóm nút chọn (Sáng/Chiều/Tối, Có đá/Không đá...) dùng chung một chỗ
const OptionButtons = ({
  options,
  styles,
}: {
  options: { label: string; active: boolean; onPress: () => void }[];
  styles: Styles;
}) => (
  <View style={styles.optionButtons}>
    {options.map((o) => (
      <TouchableOpacity
        key={o.label}
        style={[styles.optionButton, o.active && styles.optionButtonActive]}
        onPress={o.onPress}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.optionButtonText,
            o.active && styles.optionButtonTextActive,
          ]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.2}
        >
          {o.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

export default function CartScreen() {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(r, insets),
    [r.width, r.height, insets.bottom, insets.left, insets.right],
  );
  const isWide = r.width >= 900; // phải khớp với createStyles

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
    clearCart,
  } = useCart();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [hasIce, setHasIce] = useState(false);
  const [hasStyrofoamBox, setHasStyrofoamBox] = useState(false);
  const [receiveAtCompany, setReceiveAtCompany] = useState(true);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [desiredDate, setDesiredDate] = useState(new Date());
  const [desiredTimeSlot, setDesiredTimeSlot] = useState("Tối");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const router = useRouter();

  const formatDeliveryDate = (date: Date) =>
    new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  }, [fetchCart]);

  const handlePlaceOrder = async () => {
    if (isPlacingOrder || items.length === 0) return;

    if (!user?.code) {
      Alert.alert(
        "Lỗi",
        "Không xác định được thông tin khách hàng, vui lòng đăng nhập lại.",
      );
      return;
    }

    if (!receiveAtCompany && !deliveryAddress.trim()) {
      Alert.alert("Thiếu địa chỉ", "Vui lòng nhập địa chỉ nhận hàng.");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderItems = items.map((item) => ({
        // ⚠️ Backend tìm sản phẩm bằng Product.findOne({ id: item.productId }) — dùng field "id"
        // tuỳ chỉnh của Product, KHÔNG phải Mongo _id. Nếu product_id (đã populate) chưa có field "id"
        // này, dòng dưới sẽ fallback về _id và có thể không khớp — cần kiểm tra lại Product model.
        productId:
          (item.product_id as any)?.id || (item.product_id as any)?._id,
        quantity: item.quantity,
      }));

      const newOrder = await orderService.createOrderFromApp({
        customerCode: user.code,
        customerName: (user as any).name || user.code,
        items: orderItems,
        total,
        paymentMethod: "Tiền mặt",
        deliveryDate: desiredDate.toISOString(),
        deliveryRequest: {
          desiredDate: desiredDate.toISOString(),
          desiredTimeSlot,
          hasIce,
          hasStyrofoamBox,
          deliveryAddress: receiveAtCompany
            ? "Nhận tại công ty"
            : deliveryAddress.trim(),
        },
      });

      await clearCart();

      Alert.alert("Đặt hàng thành công", `Mã đơn hàng: #${newOrder.orderId}`, [
        {
          text: "Xem đơn hàng",
          onPress: () => router.push(`/bhnd/order/${newOrder._id}`),
        },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Đặt hàng thất bại",
        err?.message || "Có lỗi xảy ra, vui lòng thử lại.",
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

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
            <Ionicons
              name="cart-outline"
              size={r.ms(40)}
              color={theme.colors.primary}
            />
          </View>
          <EmptyState
            title="Giỏ hàng trống"
            description="Thêm sản phẩm để bắt đầu mua sắm"
          />
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push("/bhnd/(main)/product")}
            activeOpacity={0.85}
          >
            <Text style={styles.shopButtonText} maxFontSizeMultiplier={1.2}>
              Tiếp tục mua sắm
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Tóm tắt một dòng cho thanh giao hàng
  const deliverySummary = [
    formatDeliveryDate(desiredDate),
    desiredTimeSlot,
    hasIce ? "Có đá" : "Không đá",
    hasStyrofoamBox ? "Có thùng xốp" : "Không thùng",
  ].join(" · ");

  // Toàn bộ tuỳ chọn giao hàng: dùng inline (màn rộng) hoặc trong bảng trượt (điện thoại)
  const deliveryOptions = (
    <>
      <Text style={styles.optionLabel} maxFontSizeMultiplier={1.3}>
        Địa chỉ nhận hàng
      </Text>
      <View style={styles.addressOptions}>
        <TouchableOpacity
          accessibilityRole="radio"
          accessibilityState={{ selected: receiveAtCompany }}
          style={styles.addressOption}
          onPress={() => setReceiveAtCompany(true)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={receiveAtCompany ? "radio-button-on" : "radio-button-off"}
            size={r.ms(20)}
            color={
              receiveAtCompany ? theme.colors.primary : theme.colors.textMuted
            }
          />
          <Text style={styles.addressOptionText}>1. Nhận tại công ty</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="radio"
          accessibilityState={{ selected: !receiveAtCompany }}
          style={styles.addressOption}
          onPress={() => setReceiveAtCompany(false)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={!receiveAtCompany ? "radio-button-on" : "radio-button-off"}
            size={r.ms(20)}
            color={
              !receiveAtCompany ? theme.colors.primary : theme.colors.textMuted
            }
          />
          <Text style={styles.addressOptionText}>2. Khác</Text>
        </TouchableOpacity>
      </View>
      {!receiveAtCompany && (
        <TextInput
          accessibilityLabel="Địa chỉ nhận hàng khác"
          style={styles.addressInput}
          value={deliveryAddress}
          onChangeText={setDeliveryAddress}
          placeholder="Nhập địa chỉ giao hàng"
          placeholderTextColor={theme.colors.textMuted}
          multiline
          maxFontSizeMultiplier={1.2}
        />
      )}
      <View style={styles.deliveryRow}>
        <View style={styles.deliveryDateGroup}>
          <Text style={styles.optionLabel} maxFontSizeMultiplier={1.3}>
            Ngày nhận
          </Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <Text
              style={styles.dateButtonText}
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}
            >
              {formatDeliveryDate(desiredDate)}
            </Text>
            <Ionicons
              name="calendar-outline"
              size={r.ms(17)}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={desiredDate}
              mode="date"
              minimumDate={new Date()}
              display="default"
              onValueChange={(_, selectedDate) => {
                setShowDatePicker(false);
                setDesiredDate(selectedDate);
              }}
              onDismiss={() => setShowDatePicker(false)}
              onNeutralButtonPress={() => setShowDatePicker(false)}
            />
          )}
        </View>

        <View style={styles.deliveryTimeGroup}>
          <Text style={styles.optionLabel} maxFontSizeMultiplier={1.3}>
            Giờ nhận
          </Text>
          <OptionButtons
            styles={styles}
            options={["Sáng", "Chiều", "Tối"].map((slot) => ({
              label: slot,
              active: desiredTimeSlot === slot,
              onPress: () => setDesiredTimeSlot(slot),
            }))}
          />
        </View>
      </View>

      <View style={styles.optionGroup}>
        <Text style={styles.optionLabel} maxFontSizeMultiplier={1.3}>
          Đá
        </Text>
        <OptionButtons
          styles={styles}
          options={[
            {
              label: "Không đá",
              active: !hasIce,
              onPress: () => setHasIce(false),
            },
            { label: "Có đá", active: hasIce, onPress: () => setHasIce(true) },
          ]}
        />
      </View>

      <View style={styles.optionGroup}>
        <Text style={styles.optionLabel} maxFontSizeMultiplier={1.3}>
          Thùng xốp (thêm tiền)
        </Text>
        <OptionButtons
          styles={styles}
          options={[
            {
              label: "Không thùng",
              active: !hasStyrofoamBox,
              onPress: () => setHasStyrofoamBox(false),
            },
            {
              label: "Có thùng xốp",
              active: hasStyrofoamBox,
              onPress: () => setHasStyrofoamBox(true),
            },
          ]}
        />
      </View>
    </>
  );

  const checkoutButton = (
    <Button
      style={styles.checkoutButton}
      label={isPlacingOrder ? "Đang xử lý..." : "Xác nhận hàng"}
      onPress={handlePlaceOrder}
      disabled={isPlacingOrder}
    />
  );

  return (
    <View style={styles.container}>
      <Header title="Giỏ hàng" />

      {/* Điện thoại: danh sách chiếm gần hết màn hình, thanh xác nhận thấp ở dưới.
          Tablet / xoay ngang (>= 900dp): hai cột, tổng kết đầy đủ nằm bên phải. */}
      <View style={styles.body}>
        <FlatList
          style={styles.list}
          data={items}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <CartItemComponent
                item={item}
                onQuantityChange={(quantity) =>
                  updateQuantity(item._id, quantity)
                }
                onRemove={() => removeItem(item._id)}
              />
            </View>
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

        {isWide ? (
          // ---------- Màn rộng: tổng kết đầy đủ, tuỳ chọn hiển thị sẵn ----------
          <View style={styles.summary}>
            <ScrollView
              style={styles.summaryScroll}
              contentContainerStyle={styles.summaryScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tổng tiền hàng</Text>
                <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tiền ship</Text>
                <Text style={styles.summaryValue}>
                  {formatPrice(shippingCost)}
                </Text>
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
              {deliveryOptions}
            </ScrollView>

            <View style={styles.summaryFooterWide}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng tiền</Text>
                <Text style={styles.totalValue}>{formatPrice(total)}</Text>
              </View>
              {checkoutButton}
            </View>
          </View>
        ) : (
          // ---------- Điện thoại: thanh xác nhận gọn ----------
          <View style={styles.summary}>
            {/* Một dòng tóm tắt giao hàng, bấm để sửa trong bảng trượt */}
            <TouchableOpacity
              style={styles.deliveryChip}
              onPress={() => setShowOptionsSheet(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="calendar-outline"
                size={r.ms(17)}
                color={theme.colors.primary}
              />
              <Text
                style={styles.deliveryChipText}
                numberOfLines={1}
                maxFontSizeMultiplier={1.2}
              >
                Tuỳ chọn giao hàng
              </Text>
              <Ionicons
                name="chevron-up"
                size={r.ms(16)}
                color={theme.colors.textMuted}
              />
            </TouchableOpacity>

            {/* Tổng tiền bên trái, nút xác nhận bên phải, cùng một hàng */}
            <View style={styles.summaryFooter}>
              <View style={styles.totalBlock}>
                <Text style={styles.totalLabel} maxFontSizeMultiplier={1.2}>
                  Tổng tiền
                </Text>
                <Text
                  style={styles.totalValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  maxFontSizeMultiplier={1.2}
                >
                  {formatPrice(total)}
                </Text>
                <Text
                  style={styles.breakdownText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  maxFontSizeMultiplier={1.2}
                >
                  {`Hàng ${formatPrice(subtotal)} + ship ${formatPrice(shippingCost)}${
                    discount > 0 ? ` − giảm ${formatPrice(discount)}` : ""
                  }`}
                </Text>
              </View>
              <View style={styles.checkoutWrapper}>{checkoutButton}</View>
            </View>
          </View>
        )}
      </View>

      {/* Bảng trượt tuỳ chọn giao hàng (điện thoại) */}
      <Modal
        visible={showOptionsSheet && !isWide}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowOptionsSheet(false)}
        supportedOrientations={["portrait", "landscape"]}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsSheet(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.sheetCard}
            onPress={() => {}}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} maxFontSizeMultiplier={1.2}>
                Tuỳ chọn giao hàng
              </Text>
              <TouchableOpacity
                onPress={() => setShowOptionsSheet(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="close"
                  size={r.ms(24)}
                  color={theme.colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              showsVerticalScrollIndicator={false}
            >
              {deliveryOptions}
            </ScrollView>

            <TouchableOpacity
              style={styles.sheetDoneButton}
              onPress={() => setShowOptionsSheet(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.sheetDoneText} maxFontSizeMultiplier={1.2}>
                Xong
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (
  r: ReturnType<typeof useResponsive>,
  insets: { bottom: number; left: number; right: number },
) => {
  const isWide = r.width >= 900; // tablet ngang / màn rộng: 2 cột
  const stackDelivery = r.isTablet || r.width < 360;
  const CONTENT_MAX = 720; // tablet dọc: giới hạn bề rộng nội dung
  const summaryWidth = Math.min(420, r.width * 0.4);

  // Căn giữa nội dung khi màn hình rộng hơn CONTENT_MAX (chế độ 1 cột)
  const centerPad = Math.max(0, (r.width - CONTENT_MAX) / 2);
  const listSide = Math.max(r.ms(16), centerPad);
  const summarySide = Math.max(r.ms(16), centerPad);

  const sideL = isWide ? r.ms(16) : insets.left + summarySide;
  const sideR = isWide ? r.ms(16) : insets.right + summarySide;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    body: {
      flex: 1,
      flexDirection: isWide ? "row" : "column",
    },
    list: {
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: r.ms(32),
    },
    emptyIconCircle: {
      width: Math.round(r.ms(88)),
      height: Math.round(r.ms(88)),
      borderRadius: Math.round(r.ms(44)),
      backgroundColor: theme.colors.primarySoft,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: r.ms(16),
    },
    shopButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: r.ms(12),
      paddingHorizontal: r.ms(28),
      borderRadius: theme.radius.pill,
      marginBottom: r.ms(20),
      minHeight: 44,
      justifyContent: "center",
    },
    shopButtonText: {
      color: theme.colors.onPrimary,
      fontSize: r.font(14),
      fontWeight: "700",
    },
    listContent: {
      paddingTop: r.ms(14),
      paddingBottom: r.ms(12),
      paddingLeft: insets.left + (isWide ? r.ms(16) : listSide),
      paddingRight: isWide ? r.ms(16) : listSide,
    },
    // CartItem đã có marginBottom riêng, bỏ khoảng cách đôi để list gọn hơn
    item: {
      marginBottom: 0,
    },

    // ---------- Khối tổng kết ----------
    summary: {
      backgroundColor: theme.colors.surface,
      paddingTop: r.ms(12),
      ...theme.shadow.raised,
      borderTopLeftRadius: theme.radius.xl,
      ...(isWide
        ? {
            width: summaryWidth,
            alignSelf: "stretch" as const,
            paddingRight: insets.right,
            shadowOffset: { width: -3, height: 0 },
          }
        : {
            borderTopRightRadius: theme.radius.xl,
          }),
    },

    // Điện thoại: thanh tóm tắt giao hàng
    deliveryChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: r.ms(8),
      marginLeft: sideL,
      marginRight: sideR,
      paddingHorizontal: r.ms(12),
      paddingVertical: r.ms(9),
      minHeight: 40,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.primarySoft,
    },
    deliveryChipText: {
      flex: 1,
      fontSize: r.font(13),
      fontWeight: "500",
      color: theme.colors.text,
    },
    // Điện thoại: tổng tiền + nút xác nhận trên cùng một hàng
    summaryFooter: {
      flexDirection: "row",
      alignItems: "center",
      gap: r.ms(12),
      paddingTop: r.ms(12),
      paddingBottom: insets.bottom + r.ms(12),
      paddingLeft: sideL,
      paddingRight: sideR,
    },
    totalBlock: {
      flex: 1,
    },
    checkoutWrapper: {
      flex: 1,
      minWidth: r.ms(130),
    },
    breakdownText: {
      fontSize: r.font(11),
      color: theme.colors.textMuted,
      marginTop: 2,
    },

    // Màn rộng
    summaryScroll: { flex: 1 },
    summaryScrollContent: {
      paddingLeft: sideL,
      paddingRight: sideR,
      paddingTop: r.ms(6),
      paddingBottom: r.ms(4),
    },
    summaryFooterWide: {
      paddingTop: r.ms(10),
      paddingBottom: insets.bottom + r.ms(12),
      paddingLeft: sideL,
      paddingRight: sideR,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: r.ms(6),
    },
    summaryLabel: {
      fontSize: r.font(14),
      color: theme.colors.textSecondary,
    },
    summaryValue: {
      fontSize: r.font(14),
      fontWeight: "600",
      color: theme.colors.text,
    },
    discountValue: {
      color: theme.colors.success,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
      marginVertical: r.ms(10),
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    totalLabel: {
      fontSize: r.font(13),
      color: theme.colors.textSecondary,
    },
    totalValue: {
      fontSize: r.font(20),
      fontWeight: "800",
      color: theme.colors.danger,
    },
    checkoutButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radius.md,
      marginTop: isWide ? r.ms(10) : 0,
    },

    // ---------- Tuỳ chọn giao hàng (dùng cho cả inline và bảng trượt) ----------
    deliveryRow: {
      flexDirection: stackDelivery ? "column" : "row",
      gap: r.ms(8),
      marginBottom: r.ms(10),
    },
    deliveryDateGroup: {
      flex: stackDelivery ? 0 : 1,
    },
    deliveryTimeGroup: {
      flex: stackDelivery ? 0 : 1,
    },
    optionGroup: {
      marginBottom: r.ms(10),
    },
    optionLabel: {
      color: theme.colors.text,
      fontSize: r.font(14),
      fontWeight: "700",
      marginBottom: 6,
    },
    addressInput: {
      minHeight: 44,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.sm,
      paddingHorizontal: r.ms(12),
      paddingVertical: r.ms(9),
      marginBottom: r.ms(10),
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
      fontSize: r.font(14),
      textAlignVertical: "top",
    },
    addressOptions: {
      marginBottom: r.ms(10),
    },
    addressOption: {
      minHeight: 32,
      flexDirection: "row",
      alignItems: "center",
      gap: r.ms(8),
    },
    addressOptionText: {
      color: theme.colors.text,
      fontSize: r.font(14),
    },
    optionButtons: {
      flexDirection: "row",
      gap: r.ms(8),
    },
    dateButton: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.sm,
      paddingHorizontal: r.ms(12),
      paddingVertical: r.ms(7),
      minHeight: 40,
      backgroundColor: theme.colors.surface,
    },
    dateButtonText: {
      flex: 1,
      color: theme.colors.text,
      fontSize: r.font(14),
      fontWeight: "500",
    },
    optionButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.sm,
      paddingVertical: r.ms(7),
      paddingHorizontal: 4,
      minHeight: 40,
      backgroundColor: theme.colors.surface,
    },
    optionButtonActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
    },
    optionButtonText: {
      color: theme.colors.textSecondary,
      fontSize: r.font(13),
    },
    optionButtonTextActive: {
      color: theme.colors.primary,
      fontWeight: "700",
    },

    // ---------- Bảng trượt ----------
    sheetOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      alignItems: "center",
      backgroundColor: theme.colors.overlay,
    },
    sheetCard: {
      width: "100%",
      maxWidth: 600,
      maxHeight: r.height * 0.9,
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      paddingHorizontal: r.ms(18),
      paddingTop: r.ms(10),
      paddingBottom: insets.bottom + r.ms(16),
    },
    sheetHandle: {
      width: r.ms(40),
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.border,
      alignSelf: "center",
      marginBottom: r.ms(12),
    },
    sheetHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: r.ms(12),
    },
    sheetTitle: {
      fontSize: r.font(17),
      fontWeight: "800",
      color: theme.colors.text,
    },
    sheetScroll: {
      flexGrow: 0,
      flexShrink: 1,
    },
    sheetDoneButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radius.md,
      paddingVertical: r.ms(13),
      alignItems: "center",
      marginTop: r.ms(8),
    },
    sheetDoneText: {
      color: theme.colors.onPrimary,
      fontSize: r.font(15),
      fontWeight: "700",
    },
  });
};
