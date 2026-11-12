import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  CameraView,
  useCameraPermissions,
  type CameraView as CameraViewType,
  type CameraType,
} from "expo-camera";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
// Chỉnh lại đường dẫn nếu cấu trúc thư mục của bạn khác
import { useResponsive } from "../../hooks/useResponsive";
import { theme } from "../../styles/theme";

interface BarcodeScannerProps {
  isVisible: boolean;
  onBarCodeScanned: (data: string) => void;
  onClose: () => void;
  title?: string;
}

/**
 * Vỏ ngoài: dùng Modal toàn màn hình để không phụ thuộc vị trí của component cha
 * (bản cũ dùng position absolute + top/height cố định nên dễ vỡ layout).
 * Nội dung chỉ được mount khi mở, nên camera tự tắt khi đóng.
 */
export const BarcodeScanner: React.FC<BarcodeScannerProps> = (props) => {
  return (
    <Modal
      visible={props.isVisible}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={props.onClose} // nút Back trên Android
      supportedOrientations={["portrait", "landscape"]}
    >
      {/* Cần thiết: safe area bên trong Modal đôi khi trả về 0 nếu thiếu provider */}
      <SafeAreaProvider>
        <ScannerContent {...props} />
      </SafeAreaProvider>
    </Modal>
  );
};

const ScannerContent: React.FC<BarcodeScannerProps> = ({
  onBarCodeScanned,
  onClose,
  title = "Quét mã vạch",
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraType>("back");
  const [cameraError, setCameraError] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const cameraRef = useRef<CameraViewType>(null);

  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(r, insets),
    [r.width, r.height, insets.top, insets.bottom, insets.left, insets.right],
  );

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || !data) return;
    setScanned(true);
    // Không gọi onClose() ở đây nữa: component cha tự ẩn scanner sau khi nhận mã.
    // (Bản cũ gọi onClose sau 500ms làm cha reset isProcessing/loginError
    //  trong lúc request đăng nhập vẫn đang chạy.)
    onBarCodeScanned(data);
  };

  const handleCameraMountError = ({ message }: { message: string }) => {
    console.error("Camera preview failed to start:", message);
    setCameraError(true);
  };

  const retryCamera = () => {
    setCameraFacing((facing) => (facing === "back" ? "front" : "back"));
    setCameraError(false);
    setCameraKey((key) => key + 1);
  };

  // Đang kiểm tra quyền
  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.messageContainer}>
          <Text style={styles.messageText} maxFontSizeMultiplier={1.3}>
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
          <View style={styles.messageIcon}>
            <Ionicons
              name="camera-outline"
              size={r.ms(30)}
              color={theme.colors.primary}
            />
          </View>
          <Text style={styles.messageText} maxFontSizeMultiplier={1.3}>
            Không có quyền truy cập camera
          </Text>

          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            activeOpacity={0.85}
          >
            <Text
              style={styles.permissionButtonText}
              maxFontSizeMultiplier={1.3}
            >
              Cấp quyền Camera
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.permissionButton, styles.permissionButtonGhost]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text
              style={styles.permissionButtonText}
              maxFontSizeMultiplier={1.3}
            >
              Đóng
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (cameraError) {
    return (
      <View style={styles.container}>
        <View style={styles.messageContainer}>
          <View style={styles.messageIcon}>
            <Ionicons
              name="camera-outline"
              size={r.ms(30)}
              color={theme.colors.primary}
            />
          </View>
          <Text style={styles.messageText} maxFontSizeMultiplier={1.3}>
            Không thể mở camera. Hãy kiểm tra quyền truy cập hoặc đóng ứng dụng
            khác đang sử dụng camera.
          </Text>

          <TouchableOpacity
            style={styles.permissionButton}
            onPress={retryCamera}
            activeOpacity={0.85}
          >
            <Text
              style={styles.permissionButtonText}
              maxFontSizeMultiplier={1.3}
            >
              Đổi camera và thử lại
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.permissionButton, styles.permissionButtonGhost]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text
              style={styles.permissionButtonText}
              maxFontSizeMultiplier={1.3}
            >
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
        key={cameraKey}
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={cameraFacing}
        barcodeScannerSettings={{ barcodeTypes: ["code128"] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        onMountError={handleCameraMountError}
      />

      <View style={styles.overlay}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={r.ms(22)} color="#FFF" />
          </TouchableOpacity>

          <Text
            style={styles.headerTitle}
            maxFontSizeMultiplier={1.2}
            numberOfLines={1}
          >
            {title}
          </Text>

          {/* Cùng kích thước với nút đóng để tiêu đề nằm chính giữa */}
          <View style={styles.headerSpacer} />
        </View>

        {/* Scan Area */}
        <View style={styles.scanAreaContainer}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.instructionPill}>
            <Text style={styles.instructionText} maxFontSizeMultiplier={1.3}>
              Hướng camera vào mã vạch Code 128
            </Text>
          </View>
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
            activeOpacity={0.85}
          >
            {scanned && (
              <Ionicons
                name="refresh"
                size={r.ms(17)}
                color="#FFF"
                style={{ marginRight: 8 }}
              />
            )}
            <Text style={styles.rescanButtonText} maxFontSizeMultiplier={1.3}>
              {scanned ? "Quét lại" : "Chờ quét..."}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const createStyles = (
  r: ReturnType<typeof useResponsive>,
  insets: { top: number; bottom: number; left: number; right: number },
) => {
  // Khung quét theo tỉ lệ màn hình, có trần cho tablet, và không vượt quá
  // 45% chiều cao khi xoay ngang
  const frameWidth = Math.min(r.width * 0.8, 480);
  const frameHeight = Math.min(frameWidth * 0.6, r.height * 0.45);
  const cornerSize = Math.round(r.ms(34));

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#000",
      justifyContent: "center",
      alignItems: "center",
    },

    messageContainer: {
      backgroundColor: "rgba(28, 20, 21, 0.92)",
      padding: r.ms(24),
      borderRadius: theme.radius.xl,
      alignItems: "center",
      maxWidth: 420,
      marginHorizontal: r.ms(24),
    },

    messageIcon: {
      width: r.ms(60),
      height: r.ms(60),
      borderRadius: r.ms(30),
      backgroundColor: theme.colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: r.ms(14),
    },

    messageText: {
      color: "#FFF",
      fontSize: r.font(16),
      marginBottom: r.ms(8),
      textAlign: "center",
    },

    permissionButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: r.ms(10),
      paddingHorizontal: r.ms(20),
      borderRadius: theme.radius.md,
      marginTop: r.ms(12),
      minHeight: 44,
      minWidth: 200,
      alignItems: "center",
      justifyContent: "center",
    },

    // Nút phụ (Đóng): viền trắng mờ, không tranh với nút chính
    permissionButtonGhost: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.35)",
    },

    permissionButtonText: {
      color: "#FFF",
      fontSize: r.font(14),
      fontWeight: "700",
    },

    overlay: {
      ...StyleSheet.absoluteFill,
      justifyContent: "space-between",
    },

    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      paddingTop: insets.top + r.ms(12),
      paddingBottom: r.ms(12),
      paddingLeft: insets.left + r.ms(16),
      paddingRight: insets.right + r.ms(16),
      backgroundColor: "rgba(0,0,0,0.55)",
    },

    headerButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(255,255,255,0.16)",
      justifyContent: "center",
      alignItems: "center",
    },

    headerSpacer: {
      width: 44,
      height: 44,
    },

    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: r.font(18),
      fontWeight: "700",
      color: "#FFF",
    },

    scanAreaContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },

    scanFrame: {
      width: frameWidth,
      height: frameHeight,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.25)",
      borderRadius: 20,
      backgroundColor: "transparent",
    },

    corner: {
      position: "absolute",
      width: cornerSize,
      height: cornerSize,
      borderColor: theme.colors.primary,
    },
    cornerTL: {
      top: -2,
      left: -2,
      borderTopWidth: 4,
      borderLeftWidth: 4,
      borderTopLeftRadius: 20,
    },
    cornerTR: {
      top: -2,
      right: -2,
      borderTopWidth: 4,
      borderRightWidth: 4,
      borderTopRightRadius: 20,
    },
    cornerBL: {
      bottom: -2,
      left: -2,
      borderBottomWidth: 4,
      borderLeftWidth: 4,
      borderBottomLeftRadius: 20,
    },
    cornerBR: {
      bottom: -2,
      right: -2,
      borderBottomWidth: 4,
      borderRightWidth: 4,
      borderBottomRightRadius: 20,
    },

    instructionPill: {
      marginTop: r.ms(20),
      backgroundColor: "rgba(0,0,0,0.55)",
      borderRadius: theme.radius.pill,
      paddingVertical: r.ms(8),
      paddingHorizontal: r.ms(16),
      marginHorizontal: r.ms(24),
    },
    instructionText: {
      color: "#FFF",
      fontSize: r.font(14),
      textAlign: "center",
    },

    bottomBar: {
      paddingTop: r.ms(16),
      paddingBottom: insets.bottom + r.ms(16),
      paddingLeft: insets.left + r.ms(16),
      paddingRight: insets.right + r.ms(16),
      backgroundColor: "rgba(0,0,0,0.55)",
      alignItems: "center",
    },

    rescanButton: {
      flexDirection: "row",
      backgroundColor: theme.colors.primary,
      paddingVertical: r.ms(12),
      paddingHorizontal: r.ms(24),
      borderRadius: theme.radius.md,
      alignItems: "center",
      width: "100%",
      maxWidth: 360,
      minHeight: 48,
      justifyContent: "center",
    },

    rescanButtonDisabled: {
      backgroundColor: "rgba(255,255,255,0.18)",
    },

    rescanButtonText: {
      color: "#FFF",
      fontSize: r.font(14),
      fontWeight: "700",
    },
  });
};
