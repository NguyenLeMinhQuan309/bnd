import React, { useMemo, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useAuth } from "../../../hooks/useAuth";
import { useResponsive } from "../../../hooks/useResponsive";
import { Button } from "../../../components/common/Button";
import { BarcodeScanner } from "../../../components/common/BarcodeScanner";
import { barcodeService } from "../../../services/barcodeService";
import { theme } from "@/src/styles/theme";

export default function LoginScreen() {
  // Hook phải gọi BÊN TRONG component (bản cũ gọi ở cấp module là sai)
  const navigator = useRouter();
  const insets = useSafeAreaInsets();
  const r = useResponsive();
  const styles = useMemo(
    () => createStyles(r, insets),
    [r.width, r.height, insets],
  );

  const { setUserFromBarcode, isLoading, error } = useAuth();
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(true);
  const [employeeCode, setEmployeeCode] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLogin = async (inputCode: string) => {
    const code = inputCode.trim();
    if (!code) {
      setLoginError("Vui lòng nhập mã nhân viên.");
      return;
    }

    setShowBarcodeScanner(false);
    setIsProcessing(true);
    setLoginError(null);

    try {
      // Lấy dữ liệu khách hàng từ backend
      const customerData = await barcodeService.getCustomerByBarcode(code);

      // Set user vào context
      await setUserFromBarcode(customerData);

      // Điều hướng đến trang chủ
      navigator.replace("/bhnd/(main)/home");
    } catch (err: any) {
      console.error("Employee login error:", err);
      setLoginError(
        err.message || "Không tìm thấy dữ liệu nhân viên. Vui lòng kiểm tra mã.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      // flexGrow + justifyContent phải nằm ở contentContainerStyle mới có tác dụng
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBadge}>
            <Ionicons
              name="scan"
              size={r.ms(32)}
              color={theme.colors.onPrimary}
            />
          </View>
          <Text style={styles.title} maxFontSizeMultiplier={1.2}>
            Bannoidia
          </Text>
          <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
            Nhập mã nhân viên hoặc quét mã để đăng nhập
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText} maxFontSizeMultiplier={1.3}>
              {error}
            </Text>
          </View>
        )}

        {loginError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText} maxFontSizeMultiplier={1.3}>
              {loginError}
            </Text>
          </View>
        )}

        <View style={styles.loginContainer}>
          <TextInput
            accessibilityLabel="Mã nhân viên"
            style={styles.codeInput}
            value={employeeCode}
            onChangeText={(value) => {
              setEmployeeCode(value);
              setLoginError(null);
            }}
            placeholder="Nhập mã nhân viên"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={() => void handleLogin(employeeCode)}
            editable={!isProcessing && !isLoading}
          />
          <Button
            label="Đăng nhập"
            onPress={() => void handleLogin(employeeCode)}
            loading={isProcessing || isLoading}
            style={styles.reopenButton}
          />
          <Button
            label="Quét mã bằng camera"
            variant="secondary"
            onPress={() => {
              setLoginError(null);
              setShowBarcodeScanner(true);
            }}
            disabled={isProcessing || isLoading}
            style={styles.scanButton}
          />
        </View>
      </View>

      <BarcodeScanner
        isVisible={showBarcodeScanner}
        onBarCodeScanned={handleLogin}
        onClose={() => {
          setShowBarcodeScanner(false);
        }}
        title="Quét mã nhân viên"
      />
    </ScrollView>
  );
}

const createStyles = (
  r: ReturnType<typeof useResponsive>,
  insets: { top: number; bottom: number },
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center", // căn giữa khối nội dung trên tablet
      paddingTop: insets.top + r.ms(24),
      paddingBottom: insets.bottom + r.ms(24),
      paddingHorizontal: r.ms(24),
    },
    content: {
      width: "100%",
      maxWidth: 480, // tablet: không cho giãn hết chiều ngang
    },
    logoContainer: {
      alignItems: "center",
      marginBottom: r.isLandscape ? r.ms(24) : r.ms(48),
    },
    // Huy hiệu đỏ chứa icon quét: điểm nhấn thương hiệu duy nhất của màn hình
    logoBadge: {
      width: r.ms(72),
      height: r.ms(72),
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: r.ms(16),
      ...theme.shadow.card,
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.3,
    },
    title: {
      fontSize: r.font(34),
      fontWeight: "800",
      color: theme.colors.text,
      marginBottom: r.ms(6),
    },
    subtitle: {
      fontSize: r.font(15),
      color: theme.colors.textSecondary,
      fontWeight: "500",
    },
    errorContainer: {
      backgroundColor: theme.colors.dangerBg,
      borderRadius: theme.radius.md,
      padding: r.ms(12),
      marginBottom: r.ms(20),
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.danger,
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: r.font(14),
      fontWeight: "500",
    },
    loginContainer: {
      padding: r.ms(24),
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...theme.shadow.card,
    },
    codeInput: {
      width: "100%",
      maxWidth: 280,
      alignSelf: "center",
      backgroundColor: theme.colors.background,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: r.ms(14),
      paddingVertical: r.ms(12),
      marginBottom: r.ms(12),
      color: theme.colors.text,
      fontSize: r.font(16),
    },
    reopenButton: {
      width: "100%",
      maxWidth: 280,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radius.md,
      alignSelf: "center",
    },
    scanButton: {
      width: "100%",
      maxWidth: 280,
      borderRadius: theme.radius.md,
      alignSelf: "center",
      marginTop: r.ms(10),
    },
  });
