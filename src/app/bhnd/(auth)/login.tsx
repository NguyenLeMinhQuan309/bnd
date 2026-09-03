import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '../../../components/common/Button';
import { BarcodeScanner } from '../../../components/common/BarcodeScanner';
import { barcodeService } from '../../../services/barcodeService';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
const navigator = useRouter();

export default function LoginScreen() {
  const { setUserFromBarcode, isLoading, error } = useAuth();
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBarcodeScan = async (scannedCode: string) => {
    setShowBarcodeScanner(false);
    setIsProcessing(true);
    setLoginError(null);
    const code = scannedCode.trim();

    try {
      // Lấy dữ liệu khách hàng từ backend
      const customerData = await barcodeService.getCustomerByBarcode(code);

      console.log('Customer data from barcode:', customerData);

      // Lưu dữ liệu đăng nhập vào local storage
      await AsyncStorage.setItem('userData', JSON.stringify(customerData));
      await AsyncStorage.setItem('user', JSON.stringify(customerData));

      // Set user vào context
      setUserFromBarcode(customerData);

      console.log('Scan successful, navigating to home');
      
      // Điều hướng đến trang chủ
      navigator.replace('/bhnd/(main)/home');
    } catch (err: any) {
      console.error('Barcode scan error:', err);
      setLoginError(err.message || 'Không tìm thấy dữ liệu nhân viên. Vui lòng quét lại.');
      // Mở barcode scanner lại nếu lỗi
      setTimeout(() => {
        setShowBarcodeScanner(true);
        setIsProcessing(false);
      }, 1500);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.title}>Bannoidia</Text>
          <Text style={styles.subtitle}>Quét mã để đăng nhập</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loginError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{loginError}</Text>
          </View>
        )}

        {!showBarcodeScanner && (
          <View style={styles.scanningContainer}>
            <Text style={styles.scanningText}>
              {isProcessing ? 'Đang lấy dữ liệu...' : 'Bấm nút dưới để quét mã'}
            </Text>
            <Button
              label="📱 Mở Camera"
              onPress={() => setShowBarcodeScanner(true)}
              loading={isProcessing || isLoading}
              style={styles.reopenButton}
            />
          </View>
        )}
      </View>

      <BarcodeScanner
        isVisible={showBarcodeScanner}
        onBarCodeScanned={handleBarcodeScan}
        onClose={() => {
          setShowBarcodeScanner(false);
          setLoginError(null);
          setIsProcessing(false);
        }}
        title="Quét mã nhân viên"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 24,
    paddingTop: 100,
    flexGrow: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: '#149eee',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FFE8E8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  scanningContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 24,
  },
  scanningText: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  reopenButton: {
    marginTop: 12,
    minWidth: 200,
  },
});
