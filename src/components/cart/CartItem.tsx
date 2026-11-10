import React, { memo, useMemo } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { CartItem } from "../../types";
import { formatPrice } from "../../utils/formatting";
import { theme } from "../../styles/theme";
import { useResponsive } from "../../hooks/useResponsive";
import { getProductImageUrl } from "../../services/imageService";

interface CartItemComponentProps {
  item: CartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

const CartItemComponentBase: React.FC<CartItemComponentProps> = ({
  item,
  onQuantityChange,
  onRemove,
}) => {
  const r = useResponsive();
  const styles = useMemo(() => createStyles(r), [r.width, r.height]);

  const productName = item.product_id?.name || "Product";
  const productStock = Number(item.product_id?.stock);
  const maxQuantity =
    Number.isFinite(productStock) && productStock > 0
      ? productStock
      : Number.POSITIVE_INFINITY;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: getProductImageUrl(item.product_id.id || "") }}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={styles.name}
            numberOfLines={2}
            maxFontSizeMultiplier={1.2}
          >
            {productName}
          </Text>
          <TouchableOpacity
            onPress={onRemove}
            style={styles.removeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={14} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Text
          style={styles.price}
          numberOfLines={1}
          maxFontSizeMultiplier={1.2}
        >
          {formatPrice(item.price)}
        </Text>

        <View style={styles.quantityContainer}>
          <View style={styles.stepper}>
            <TouchableOpacity
              onPress={() => onQuantityChange(Math.max(1, item.quantity - 1))}
              style={styles.quantityButton}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Text style={styles.quantityButtonText}>−</Text>
            </TouchableOpacity>

            <Text style={styles.quantity} maxFontSizeMultiplier={1.1}>
              {item.quantity}
            </Text>

            <TouchableOpacity
              onPress={() =>
                onQuantityChange(Math.min(maxQuantity, item.quantity + 1))
              }
              style={styles.quantityButton}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* flex: 1 + textAlign right: thành tiền luôn nằm phải, tự co chữ
              nếu số quá dài trên màn hình hẹp, không đẩy vỡ hàng */}
          <Text
            style={styles.subtotal}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            maxFontSizeMultiplier={1.2}
          >
            {formatPrice(item.subtotal)}
          </Text>
        </View>
      </View>
    </View>
  );
};

// Chỉ re-render khi các giá trị thực sự hiển thị của ĐÚNG item này thay đổi.
// Lưu ý: khi xoay màn hình / đổi kích thước, useResponsive vẫn kích hoạt render
// lại dù memo chặn props, nên layout luôn cập nhật đúng.
export const CartItemComponent = memo(
  CartItemComponentBase,
  (prevProps, nextProps) => {
    return (
      prevProps.item._id === nextProps.item._id &&
      prevProps.item.quantity === nextProps.item.quantity &&
      prevProps.item.price === nextProps.item.price &&
      prevProps.item.subtotal === nextProps.item.subtotal
    );
  },
);

const createStyles = (r: ReturnType<typeof useResponsive>) => {
  const imageSize = Math.round(r.ms(96));
  const cardPadding = r.ms(10);
  const qtyBtn = Math.max(28, Math.round(r.ms(28)));

  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: cardPadding,
      marginBottom: r.ms(12),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...theme.shadow.card,
      minHeight: imageSize + cardPadding * 2,
    },
    image: {
      width: imageSize,
      height: imageSize,
      flexShrink: 0,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surfaceMuted,
    },
    content: {
      flex: 1,
      marginLeft: r.ms(12),
      paddingVertical: r.ms(4),
      paddingRight: r.ms(4),
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: r.ms(6),
    },
    name: {
      fontSize: r.font(14),
      fontWeight: "700",
      color: theme.colors.text,
      flex: 1,
      marginRight: r.ms(8),
    },
    removeButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceMuted,
      justifyContent: "center",
      alignItems: "center",
    },
    price: {
      fontSize: r.font(13),
      color: theme.colors.textSecondary,
      marginBottom: r.ms(10),
    },
    quantityContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    stepper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radius.sm,
      paddingHorizontal: 2,
    },
    quantityButton: {
      width: qtyBtn,
      height: qtyBtn,
      justifyContent: "center",
      alignItems: "center",
    },
    quantityButtonText: {
      fontSize: r.font(16),
      fontWeight: "700",
      color: theme.colors.primary,
    },
    quantity: {
      fontSize: r.font(14),
      fontWeight: "700",
      color: theme.colors.text,
      minWidth: r.ms(24),
      textAlign: "center",
    },
    subtotal: {
      flex: 1,
      textAlign: "right",
      fontSize: r.font(15),
      fontWeight: "800",
      color: theme.colors.danger,
      marginLeft: r.ms(8),
    },
  });
};
