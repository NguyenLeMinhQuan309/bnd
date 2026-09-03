import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { CartItem } from '../../types';
import { formatPrice } from '../../utils/formatting';

interface CartItemComponentProps {
  item: CartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

export const CartItemComponent: React.FC<CartItemComponentProps> = ({
  item,
  onQuantityChange,
  onRemove,
}) => {
  const productImage = item.product_id?.image || item.product_id?.images?.[0];
  const productName = item.product_id?.name || 'Product';
  const productStock = Number(item.product_id?.stock);
  const maxQuantity = Number.isFinite(productStock) && productStock > 0 ? productStock : Number.POSITIVE_INFINITY;

  return (
    <View style={styles.container}>
      {productImage && <Image source={{ uri: productImage }} style={styles.image} />}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>
            {productName}
          </Text>
          <TouchableOpacity onPress={onRemove}>
            <Text style={styles.removeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.price}>{formatPrice(item.price)}</Text>

        <View style={styles.quantityContainer}>
          <TouchableOpacity
            onPress={() => onQuantityChange(Math.max(1, item.quantity - 1))}
            style={styles.quantityButton}
          >
            <Text style={styles.quantityButtonText}>−</Text>
          </TouchableOpacity>

          <Text style={styles.quantity}>{item.quantity}</Text>

          <TouchableOpacity
            onPress={() => onQuantityChange(Math.min(maxQuantity, item.quantity + 1))}
            style={styles.quantityButton}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>

          <Text style={styles.subtotal}>
            {formatPrice(item.subtotal)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  removeButton: {
    fontSize: 20,
    color: '#FF3B30',
    fontWeight: '600',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B00',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  quantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  subtotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B00',
    marginLeft: 'auto',
  },
});
