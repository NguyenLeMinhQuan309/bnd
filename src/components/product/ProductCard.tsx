import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ActivityIndicator,
} from "react-native";
import { Product } from "../../types";
import { formatPrice } from "../../utils/formatting";
import { useCart } from "../../hooks/useCart";
import { theme } from "../../styles/theme";
import { useResponsive } from "../../hooks/useResponsive";
import { getProductImageUrl } from "../../services/imageService";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  onAddToCart?: (quantity: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onAddToCart,
}) => {
  const r = useResponsive();
  const styles = useMemo(() => createStyles(r), [r.width, r.height]);

  const [quantity, setQuantity] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const mountAnim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const addBtnScale = useRef(new Animated.Value(1)).current;
  const { addItem } = useCart();

  useEffect(() => {
    Animated.timing(mountAnim, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [mountAnim]);

  const price = product?.prices?.[0]?.price || 0;

  const handleAddToCart = async () => {
    if (isAdding) return; // chặn bấm liên tục / double submit
    setIsAdding(true);
    try {
      await addItem(product._id, quantity, price);
      setQuantity(0); // reset về 1 sau khi thêm thành công
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const incrementQuantity = () => setQuantity((q) => q + 1);
  const decrementQuantity = () => setQuantity((q) => Math.max(0, q - 1));

  return (
    <AnimatedTouchable
      style={[
        styles.card,
        {
          opacity: mountAnim,
          transform: [
            {
              translateY: mountAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
            { scale: pressScale },
          ],
        },
      ]}
      onPress={onPress}
      activeOpacity={0.92}
    >
      {product.id ? (
        <Image
          source={{ uri: getProductImageUrl(product.id) }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder} />
      )}

      <View style={styles.content}>
        <View>
          {/* Luôn chừa đúng 2 dòng cho tên (chiều cao = 2 x lineHeight) */}
          <Text
            style={styles.name}
            numberOfLines={2}
            maxFontSizeMultiplier={1.2}
          >
            {product?.name || ""}
          </Text>

          {/* Luôn chừa đúng 1 dòng cho specs */}
          <Text
            style={styles.specs}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
          >
            {product?.specifications || " "}
          </Text>

          <Text
            style={styles.price}
            maxFontSizeMultiplier={1.2}
            numberOfLines={1}
          >
            {formatPrice(price)}
          </Text>
        </View>

        {onAddToCart !== undefined && (
          <View style={styles.actionRow}>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={(e) => {
                  e.stopPropagation?.();
                  decrementQuantity();
                }}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue} maxFontSizeMultiplier={1.1}>
                {quantity}
              </Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={(e) => {
                  e.stopPropagation?.();
                  incrementQuantity();
                }}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* flex: 1 để nút Thêm tự co giãn theo bề rộng thẻ còn lại,
                không bị tràn trên màn hình nhỏ */}
            <Animated.View
              style={[
                styles.addWrapper,
                { transform: [{ scale: addBtnScale }] },
              ]}
            >
              <TouchableOpacity
                style={[styles.addButton, isAdding && styles.addButtonDisabled]}
                onPress={(e) => {
                  e.stopPropagation?.();
                  handleAddToCart();
                }}
                activeOpacity={0.85}
                disabled={isAdding}
                onPressIn={() =>
                  Animated.spring(addBtnScale, {
                    toValue: 0.95,
                    useNativeDriver: true,
                  }).start()
                }
                onPressOut={() =>
                  Animated.spring(addBtnScale, {
                    toValue: 1,
                    useNativeDriver: true,
                  }).start()
                }
              >
                {isAdding ? (
                  <ActivityIndicator
                    color={theme.colors.onPrimary}
                    size="small"
                  />
                ) : (
                  <Text
                    style={styles.addButtonText}
                    maxFontSizeMultiplier={1.1}
                  >
                    Thêm
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </View>
    </AnimatedTouchable>
  );
};

const createStyles = (r: ReturnType<typeof useResponsive>) => {
  const nameFont = r.font(13);
  const nameLine = Math.round(nameFont * 1.4);
  const specFont = r.font(12);
  const specLine = Math.round(specFont * 1.35);
  const stepBtn = Math.max(24, Math.round(r.ms(24)));

  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...theme.shadow.card,
      // Chiều rộng do cha quyết định, chiều cao suy ra từ ảnh (aspectRatio)
      // + nội dung có chiều cao cố định theo font, nên các thẻ cùng hàng
      // luôn bằng nhau ở mọi độ phân giải.
      width: "100%",
    },
    image: {
      width: "100%",
      aspectRatio: 1,
      backgroundColor: theme.colors.surfaceMuted,
    },
    imagePlaceholder: {
      width: "100%",
      aspectRatio: 1,
      backgroundColor: theme.colors.surfaceMuted,
    },
    content: {
      padding: r.ms(12),
    },
    name: {
      fontSize: nameFont,
      lineHeight: nameLine,
      height: nameLine * 2,
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: 2,
    },
    specs: {
      fontSize: specFont,
      lineHeight: specLine,
      height: specLine,
      color: theme.colors.textMuted,
      marginBottom: 6,
    },
    price: {
      fontSize: r.font(16),
      fontWeight: "800",
      color: theme.colors.danger,
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: r.ms(10),
    },
    stepper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radius.sm,
      paddingHorizontal: 2,
    },
    stepperBtn: {
      width: stepBtn,
      height: stepBtn,
      justifyContent: "center",
      alignItems: "center",
    },
    stepperBtnText: {
      fontSize: r.font(16),
      fontWeight: "700",
      color: theme.colors.primary,
    },
    stepperValue: {
      fontSize: r.font(13),
      fontWeight: "700",
      color: theme.colors.text,
      minWidth: r.ms(20),
      textAlign: "center",
    },
    addWrapper: {
      flex: 1,
      marginLeft: r.ms(6),
    },
    addButton: {
      height: Math.max(32, Math.round(r.ms(34))),
      minWidth: 44,
      borderRadius: theme.radius.sm,
      backgroundColor: theme.colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    addButtonDisabled: {
      opacity: 0.7,
    },
    addButtonText: {
      color: theme.colors.onPrimary,
      fontSize: r.font(12),
      fontWeight: "700",
    },
  });
};
