import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface OrderCardProps {
  orderNumber: string;
  itemCount: number;
  total: number;
  status: string;
  onPress?: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  orderNumber,
  itemCount,
  total,
  status,
  onPress,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return '#34C759';
      case 'shipped':
        return '#FF9500';
      case 'pending':
        return '#FF3B30';
      default:
        return '#999999';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.orderNumber}>Order #{orderNumber}</Text>
        <Text style={[styles.status, { color: getStatusColor(status) }]}>
          {status === 'delivered' ? '✓' : status === 'shipped' ? '◐' : '○'} {status}
        </Text>
      </View>

      <Text style={styles.divider}>━━━━━━━━━━━━━━━━━━━━━</Text>

      <View style={styles.details}>
        <Text style={styles.detail}>{itemCount} items | Total: ${total.toFixed(2)}</Text>
      </View>

      <Text style={styles.tapText}>Tap to view details →</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    color: '#E8E8E8',
    marginVertical: 8,
    fontSize: 12,
  },
  details: {
    marginBottom: 8,
  },
  detail: {
    fontSize: 14,
    color: '#666666',
  },
  tapText: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '500',
  },
});
