import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Modal, TextInput, Dimensions, Animated, Easing } from 'react-native';
import { Product } from '../../types';
import { formatPrice } from '../../utils/formatting';
import { useCart } from '../../hooks/useCart';

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
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  // console.log('ProductList rendered for product:', product?.name);
  const mountAnim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const addBtnScale = useRef(new Animated.Value(1)).current;
  const totalScale = useRef(new Animated.Value(1)).current;
  const {addItem} = useCart();
  useEffect(() => {
    Animated.timing(mountAnim, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [mountAnim]);

  const handleAddToCart = async () => {
    try {
      await addItem(
        product._id,
        quantity,
        price
      );
      setShowQuantityModal(false);
      setQuantity(1);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const handleOpenQuantitySelector = () => {
    setShowQuantityModal(true);
  };

  const handleQuantityChange = (text: string) => {
    const num = parseInt(text, 10);
    if (text === '') {
      setQuantity(1);
    } else if (!isNaN(num) && num > 0) {
      setQuantity(num);
    }
  };

  const incrementQuantity = () => setQuantity(q => q + 1);
  const decrementQuantity = () => setQuantity(q => Math.max(1, q - 1));

  useEffect(() => {
    Animated.sequence([
      Animated.timing(totalScale, { toValue: 1.06, duration: 120, useNativeDriver: true }),
      Animated.timing(totalScale, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [quantity, totalScale]);

  const price = product?.prices?.[0]?.price || 0;

  return (
    <>
      <AnimatedTouchable
        style={[
          styles.card,
          {
            opacity: mountAnim,
            transform: [
              { translateY: mountAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
              { scale: pressScale },
            ],
          },
        ]}
        onPress={onPress}
        onPressIn={() => Animated.spring(pressScale, { toValue: 0.985, friction: 8, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(pressScale, { toValue: 1, friction: 8, useNativeDriver: true }).start()}
      >
        <View style={styles.imageWrapper}>
          {product?.image ? (
            <Image source={{ uri: product.image }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.productDetails}>
            <Text style={styles.name} numberOfLines={2}>{product?.name || ''}</Text>
            {product?.specifications ? (
              <Text style={styles.specs} numberOfLines={1}>{product.specifications}</Text>
            ) : null}
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{formatPrice(price)}</Text>
            </View>
          </View>

          {onAddToCart && (
            <Animated.View style={{ transform: [{ scale: addBtnScale }] }}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleOpenQuantitySelector}
                activeOpacity={0.85}
                onPressIn={() => Animated.spring(addBtnScale, { toValue: 0.98, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(addBtnScale, { toValue: 1, useNativeDriver: true }).start()}
              >
                <Text style={styles.addButtonText}>Thêm</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </AnimatedTouchable>

      <Modal visible={showQuantityModal} transparent animationType="slide" onRequestClose={() => setShowQuantityModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowQuantityModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Chọn số lượng</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product?.name || ''}</Text>
              <Text style={styles.productPrice}>{formatPrice(price)} / {product?.unit || 'sp'} ({product?.specifications || ''})</Text>
            </View>

            <View style={styles.quantitySelector}>
              <TouchableOpacity style={styles.quantityButtonSmall} onPress={decrementQuantity}><Text style={styles.quantityButtonText}>−</Text></TouchableOpacity>
              <TextInput style={styles.quantityInput} value={String(quantity)} onChangeText={handleQuantityChange} keyboardType="number-pad" maxLength={5} textAlign="center" />
              <TouchableOpacity style={styles.quantityButtonSmall} onPress={incrementQuantity}><Text style={styles.quantityButtonText}>+</Text></TouchableOpacity>
            </View>

            <View style={styles.totalPrice}>
              <Text style={styles.totalLabel}>Tổng cộng:</Text>
              <Animated.Text style={[styles.totalAmount, { transform: [{ scale: totalScale }] }]}>{formatPrice(price * quantity)}</Animated.Text>
            </View>

            <TouchableOpacity style={styles.confirmButton} onPress={handleAddToCart}>
              <Text style={styles.confirmButtonText}>Thêm vào giỏ hàng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 110,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  imageWrapper: {
    width: 84,
    height: 84,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#F0F0F0',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productDetails: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 4,
  },
  specs: {
    fontSize: 12,
    color: '#777777',
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f10e0e',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999999',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: '#f10e0e',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    fontSize: 24,
    color: '#666666',
    width: 24,
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
  },
  productInfo: {
    paddingBottom: 16,
    borderBottomColor: '#F0F0F0',
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 13,
    color: '#f10e0e',
    fontWeight: '600',
  },
  quantitySelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    // `gap` is not supported on all React Native platforms; use spacing via margins
  },
  quantityButtonSmall: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#E0E0E0',
    borderWidth: 1,
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f10e0e',
  },
  quantityInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    paddingHorizontal: 12,
  },
  totalPrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f10e0e',
  },
  confirmButton: {
    backgroundColor: '#f10e0e',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
