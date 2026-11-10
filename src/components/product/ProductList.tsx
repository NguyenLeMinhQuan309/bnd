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

interface ProductListProps {
  product: Product;
  onPress?: () => void;
  onAddToCart?: (quantity: number) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  product,
  onPress,
  onAddToCart,
}) => {
  const r = useResponsive();
  const styles = useMemo(() => createStyles(r), [r.width, r.height]);

  const [quantity, setQuantity] = useState(1);
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
      setQuantity(1); // reset về 1 sau khi thêm thành công
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
      <View style={styles.imageWrapper}>
        {product?.id ? (
          <Image
            source={{ uri: getProductImageUrl(product.id) }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.productDetails}>
          <Text
            style={styles.name}
            numberOfLines={2}
            maxFontSizeMultiplier={1.2}
          >
            {product?.name || ""}
          </Text>
          <Text
            style={styles.specs}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
          >
            {product?.specifications || " "}
          </Text>
          <Text
            style={styles.price}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
          >
            {formatPrice(price)}
          </Text>
        </View>

        {onAddToCart !== undefined && (
          <View style={styles.actionColumn}>
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

            <Animated.View style={{ transform: [{ scale: addBtnScale }] }}>
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
  const padding = r.ms(10);
  const imageSize = Math.round(r.ms(84));

  const nameFont = r.font(13);
  const nameLine = Math.round(nameFont * 1.4);
  const specFont = r.font(12);
  const specLine = Math.round(specFont * 1.35);
  const priceFont = r.font(16);
  const priceLine = Math.round(priceFont * 1.25);

  const stepBtn = Math.max(24, Math.round(r.ms(26)));
  const addBtnHeight = Math.max(28, Math.round(r.ms(30)));

  // Chiều cao từng khối, để tính chiều cao thẻ theo đúng nội dung
  const textHeight = nameLine * 2 + 2 + specLine + 4 + priceLine;
  const actionHeight = stepBtn + 6 + addBtnHeight;

  // Lấy khối cao nhất + padding: mọi dòng cao bằng nhau,
  // tự co giãn theo độ phân giải và cỡ chữ.
  const cardHeight =
    Math.max(imageSize, textHeight, actionHeight) + padding * 2;

  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...theme.shadow.card,
      height: cardHeight,
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
    },
    imageWrapper: {
      width: cardHeight,
      height: cardHeight,
      overflow: "hidden",
      backgroundColor: theme.colors.surfaceMuted,
    },
    image: {
      width: "100%",
      height: "100%",
      backgroundColor: theme.colors.surfaceMuted,
    },
    imagePlaceholder: {
      width: "100%",
      height: "100%",
      backgroundColor: theme.colors.surfaceMuted,
    },
    content: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding,
    },
    productDetails: {
      flex: 1,
      marginRight: r.ms(8),
    },
    name: {
      fontSize: nameFont,
      lineHeight: nameLine,
      height: nameLine * 2, // luôn chừa đúng 2 dòng
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: 2,
    },
    specs: {
      fontSize: specFont,
      lineHeight: specLine,
      height: specLine, // luôn chừa 1 dòng
      color: theme.colors.textMuted,
      marginBottom: 4,
    },
    price: {
      fontSize: priceFont,
      lineHeight: priceLine,
      fontWeight: "800",
      color: theme.colors.danger,
    },
    actionColumn: {
      alignItems: "flex-end",
      justifyContent: "center",
    },
    stepper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radius.sm,
      paddingHorizontal: 2,
      marginBottom: 6,
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
      minWidth: r.ms(22),
      textAlign: "center",
    },
    addButton: {
      // Rộng bằng stepper để hai nút thẳng cột: 2 nút bước + số lượng
      width: stepBtn * 2 + r.ms(22) + 4,
      height: addBtnHeight,
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
