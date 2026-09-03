import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  type CameraView as CameraViewType,
} from 'expo-camera';

interface BarcodeScannerProps {
  isVisible: boolean;
  onBarCodeScanned: (data: string) => void;
  onClose: () => void;
  title?: string;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  isVisible,
  onBarCodeScanned,
  onClose,
  title = 'Quét mã vạch',
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const cameraRef = useRef<CameraViewType>(null);

  useEffect(() => {
    if (isVisible && !permission?.granted) {
      requestPermission();
    }
  }, [isVisible, permission?.granted, requestPermission]);

  // Reset trạng thái scan khi mở scanner
  useEffect(() => {
    if (isVisible) {
      setScanned(false);
    }
  }, [isVisible]);

  const handleBarCodeScanned = ({
    data,
  }: {
    data: string;
  }) => {
    if (scanned || !data) {
      return;
    }

    setScanned(true);

    onBarCodeScanned(data);

    // Đóng scanner sau khi quét thành công
    setTimeout(() => {
      onClose();
      setScanned(false);
    }, 500);
  };

  if (!isVisible) {
    return null;
  }

  // Đang kiểm tra quyền
  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>
            Đang yêu cầu quyền truy cập camera...
          </Text>
        </View>
      </View>
    );
  }

  // Chưa có quyền camera
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>
            Không có quyền truy cập camera
          </Text>

          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>
              Cấp quyền Camera
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.permissionButton}
            onPress={onClose}
          >
            <Text style={styles.permissionButtonText}>
              Đóng
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['code128'],
        }}
        onBarcodeScanned={
          scanned ? undefined : handleBarCodeScanned
        }
      />

      <View style={styles.overlay}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onClose}
          >
            <Text style={styles.headerButtonText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {title}
          </Text>

          <View style={styles.headerButton} />
        </View>

        {/* Scan Area */}
        <View style={styles.scanAreaContainer}>
          <View style={styles.scanFrame} />

          <Text style={styles.instructionText}>
            Hướng camera vào mã vạch Code 128
          </Text>
        </View>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.rescanButton,
              !scanned && styles.rescanButtonDisabled,
            ]}
            onPress={() => setScanned(false)}
            disabled={!scanned}
          >
            <Text style={styles.rescanButtonText}>
              {scanned ? 'Quét lại' : 'Chờ quét...'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    height: 800,
    zIndex: 1000,
  },

  messageContainer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },

  messageText: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },

  permissionButton: {
    backgroundColor: '#149eee',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
  },

  permissionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },

  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerButtonText: {
    fontSize: 28,
    color: '#FFF',
    fontWeight: '600',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },

  scanAreaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scanFrame: {
    width: 280,
    height: 200,
    borderWidth: 3,
    borderColor: '#f10e0e',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },

  instructionText: {
    color: '#FFF',
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },

  rescanButton: {
    backgroundColor: '#f10e0e',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },

  rescanButtonDisabled: {
    opacity: 0.6,
  },

  rescanButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});