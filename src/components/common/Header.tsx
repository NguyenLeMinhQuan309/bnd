import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  type LayoutChangeEvent,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "../../styles/theme";
import { useResponsive } from "../../hooks/useResponsive";
import { useAuth } from "../../hooks/useAuth";
import { getCustomerImageUrl } from "../../services/imageService";
import {
  CustomerNotification,
  notificationService,
} from "../../services/notificationService";

interface HeaderProps {
  title: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftPress?: () => void;
  onRightPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
}) => {
  const router = useRouter();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  // Đo chiều cao thật của header để đặt popup thông báo ngay bên dưới,
  // thay cho marginTop: 84 cố định
  const [headerHeight, setHeaderHeight] = React.useState(0);
  const styles = React.useMemo(
    () => createStyles(r, insets, headerHeight),
    [r.width, r.height, insets.top, insets.right, insets.left, headerHeight],
  );

  const [isNotificationModalVisible, setNotificationModalVisible] =
    React.useState(false);
  const [notifications, setNotifications] = React.useState<
    CustomerNotification[]
  >([]);
  const [readNotificationIds, setReadNotificationIds] = React.useState<
    string[]
  >([]);
  const [isEmployeeModalVisible, setEmployeeModalVisible] =
    React.useState(false);
  const [failedAvatarCode, setFailedAvatarCode] = React.useState<string | null>(
    null,
  );

  const customerCode = user?.code;

  const loadNotifications = React.useCallback(async () => {
    if (!customerCode) return;

    try {
      const storedReadIds = await AsyncStorage.getItem(
        `readNotifications:${customerCode}`,
      );
      setReadNotificationIds(storedReadIds ? JSON.parse(storedReadIds) : []);

      const data = await notificationService.getByCustomerCode(customerCode);
      setNotifications(data);
    } catch (error) {
      console.warn("Không thể tải thông báo:", error);
    }
  }, [customerCode]);

  React.useEffect(() => {
    if (!customerCode) return;

    const initialLoad = setTimeout(() => {
      void loadNotifications();
    }, 0);
    const interval = setInterval(() => {
      void loadNotifications();
    }, 30000);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, [customerCode, loadNotifications]);

  const toggleNotificationModal = () => {
    setNotificationModalVisible((prev) => !prev);
    if (!isNotificationModalVisible) void loadNotifications();
  };

  const unreadCount = notifications.filter(
    (notification) => !readNotificationIds.includes(notification._id),
  ).length;

  const handleNotificationPress = async (
    notification: CustomerNotification,
  ) => {
    const nextReadIds = readNotificationIds.includes(notification._id)
      ? readNotificationIds
      : [...readNotificationIds, notification._id];

    setReadNotificationIds(nextReadIds);
    if (customerCode) {
      await AsyncStorage.setItem(
        `readNotifications:${customerCode}`,
        JSON.stringify(nextReadIds),
      );
    }
    setNotificationModalVisible(false);
    router.push(`/bhnd/order/${notification.order}`);
  };

  const handleLogout = async () => {
    setEmployeeModalVisible(false);
    try {
      await AsyncStorage.multiRemove(["user", "userData"]);
      await logout();
      router.replace("/bhnd/(auth)/login");
    } catch (error) {
      console.error("Không thể đăng xuất:", error);
    }
  };

  const initials = user?.name
    ?.trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const employee = user as
    | (NonNullable<typeof user> & {
        address?: string;
        nghiviec?: boolean;
      })
    | null;

  return (
    <View
      style={styles.header}
      onLayout={(e: LayoutChangeEvent) =>
        setHeaderHeight(e.nativeEvent.layout.height)
      }
    >
      <View style={styles.leftActions}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Thông tin nhân viên"
          onPress={() => setEmployeeModalVisible(true)}
          style={styles.avatarButton}
          activeOpacity={0.8}
        >
          {user?.code && failedAvatarCode !== user.code ? (
            <Image
              source={{ uri: getCustomerImageUrl(user.code) }}
              style={styles.avatar}
              onError={() => setFailedAvatarCode(user.code)}
            />
          ) : (
            <View style={styles.avatarFallback}>
              {initials ? (
                <Text style={styles.avatarInitials}>{initials}</Text>
              ) : (
                <Ionicons
                  name="person"
                  size={r.ms(19)}
                  color={theme.colors.primary}
                />
              )}
            </View>
          )}
        </TouchableOpacity>
        {leftIcon ? (
          <TouchableOpacity onPress={onLeftPress} style={styles.iconButton}>
            {leftIcon}
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.title} maxFontSizeMultiplier={1.2} numberOfLines={1}>
        {title}
      </Text>

      <TouchableOpacity
        onPress={toggleNotificationModal}
        style={[styles.iconButton, styles.bellButton]}
      >
        <View>
          <Ionicons
            name="notifications-outline"
            size={r.ms(22)}
            color={theme.colors.primary}
          />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText} maxFontSizeMultiplier={1.1}>
                {unreadCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <Modal
        visible={isEmployeeModalVisible}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setEmployeeModalVisible(false)}
        supportedOrientations={["portrait", "landscape"]}
      >
        <View style={styles.employeeOverlay}>
          <View style={styles.employeeCard}>
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle} maxFontSizeMultiplier={1.2}>
                Thông tin cá nhân
              </Text>
              <TouchableOpacity
                onPress={() => setEmployeeModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Đóng"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="close"
                  size={r.ms(22)}
                  color={theme.colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.employeeIdentity}>
              {user?.code && failedAvatarCode !== user.code ? (
                <Image
                  source={{ uri: getCustomerImageUrl(user.code) }}
                  style={styles.employeeAvatar}
                  onError={() => setFailedAvatarCode(user.code)}
                />
              ) : (
                <View style={[styles.employeeAvatar, styles.avatarFallback]}>
                  <Ionicons
                    name="person"
                    size={r.ms(28)}
                    color={theme.colors.primary}
                  />
                </View>
              )}
              <Text style={styles.employeeName} maxFontSizeMultiplier={1.2}>
                {user?.name || "Nhân viên"}
              </Text>
              <Text style={styles.employeeCode} maxFontSizeMultiplier={1.2}>
                Mã: {user?.code || "Chưa cập nhật"}
              </Text>
            </View>

            {employee?.address ? (
              <View style={styles.employeeInfoRow}>
                <Ionicons
                  name="location-outline"
                  size={r.ms(18)}
                  color={theme.colors.primary}
                />
                <Text
                  style={styles.employeeInfoText}
                  maxFontSizeMultiplier={1.3}
                >
                  {employee.address}
                </Text>
              </View>
            ) : null}
            {typeof employee?.nghiviec === "boolean" ? (
              <View style={styles.employeeInfoRow}>
                <Ionicons
                  name="briefcase-outline"
                  size={r.ms(18)}
                  color={theme.colors.primary}
                />
                <Text
                  style={styles.employeeInfoText}
                  maxFontSizeMultiplier={1.3}
                >
                  {employee.nghiviec ? "Đã nghỉ việc" : "Đang làm việc"}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.85}
            >
              <Ionicons
                name="log-out-outline"
                size={r.ms(19)}
                color={theme.colors.danger}
              />
              <Text style={styles.logoutText} maxFontSizeMultiplier={1.2}>
                Đăng xuất
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isNotificationModalVisible}
        animationType="fade"
        transparent={true}
        statusBarTranslucent // để toạ độ tính từ mép trên màn hình trên cả iOS và Android
        onRequestClose={toggleNotificationModal}
        supportedOrientations={["portrait", "landscape"]}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.popupCard}>
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle} maxFontSizeMultiplier={1.2}>
                Thông báo
              </Text>
              <TouchableOpacity
                onPress={toggleNotificationModal}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="close"
                  size={r.ms(22)}
                  color={theme.colors.textMuted}
                />
              </TouchableOpacity>
            </View>
            {notifications.length === 0 ? (
              <Text style={styles.emptyText} maxFontSizeMultiplier={1.3}>
                Chưa có thông báo
              </Text>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isRead = readNotificationIds.includes(item._id);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.notificationItem,
                        isRead
                          ? styles.readNotificationItem
                          : styles.unreadNotificationItem,
                      ]}
                      onPress={() => handleNotificationPress(item)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={styles.notificationTitle}
                        maxFontSizeMultiplier={1.3}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={styles.notificationDate}
                        maxFontSizeMultiplier={1.3}
                      >
                        {new Date(item.createdAt).toLocaleString("vi-VN")}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (
  r: ReturnType<typeof useResponsive>,
  insets: { top: number; left: number; right: number },
  headerHeight: number,
) => {
  const ICON_BOX = r.ms(24) + 16; // icon + padding 8 mỗi bên

  return StyleSheet.create({
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      // Padding theo status bar/tai thỏ thật của thiết bị,
      // nền header phủ luôn vùng status bar
      paddingTop: insets.top + r.ms(8),
      paddingBottom: r.ms(8),
      paddingLeft: insets.left + r.ms(16),
      paddingRight: insets.right + r.ms(16),
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    leftActions: {
      flexDirection: "row",
      alignItems: "center",
      minWidth: ICON_BOX,
    },
    avatarButton: {
      width: ICON_BOX,
      height: ICON_BOX,
      borderRadius: theme.radius.pill,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
    },
    avatar: {
      width: "100%",
      height: "100%",
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surfaceMuted,
    },
    avatarFallback: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primarySoft,
    },
    avatarInitials: {
      color: theme.colors.primary,
      fontSize: r.font(12),
      fontWeight: "800",
    },
    title: {
      flex: 1,
      textAlign: "center",
      fontSize: r.font(18),
      fontWeight: "800",
      color: theme.colors.primary,
    },
    iconButton: {
      padding: 8,
      minWidth: ICON_BOX,
      minHeight: ICON_BOX,
      alignItems: "center",
      justifyContent: "center",
    },
    // Chuông thông báo nằm trong vòng tròn đỏ nhạt
    bellButton: {
      backgroundColor: theme.colors.primarySoft,
      borderRadius: theme.radius.pill,
    },
    badge: {
      position: "absolute",
      top: -8,
      right: -10,
      minWidth: r.ms(17),
      height: r.ms(17),
      borderRadius: r.ms(9),
      paddingHorizontal: 3,
      backgroundColor: theme.colors.primary,
      borderWidth: 2,
      borderColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: {
      color: theme.colors.onPrimary,
      fontSize: r.font(10),
      fontWeight: "700",
    },
    popupOverlay: {
      flex: 1,
      alignItems: "flex-end",
      backgroundColor: "rgba(24, 12, 12, 0.25)",
    },
    popupCard: {
      width: Math.min(360, r.width * 0.92),
      maxHeight: r.height * 0.7,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: r.ms(16),
      marginTop: headerHeight + 4,
      marginRight: insets.right + r.ms(12),
      ...theme.shadow.card,
      shadowOpacity: 0.16,
      elevation: 8,
    },
    employeeOverlay: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: r.ms(20),
      backgroundColor: theme.colors.overlay,
    },
    employeeCard: {
      width: "100%",
      maxWidth: 620,
      padding: r.ms(20),
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.surface,
      ...theme.shadow.card,
      shadowOpacity: 0.16,
      elevation: 8,
    },
    employeeIdentity: {
      alignItems: "center",
      paddingVertical: r.ms(12),
      marginBottom: r.ms(8),
    },
    employeeAvatar: {
      width: r.ms(76),
      height: r.ms(76),
      marginBottom: r.ms(12),
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surfaceMuted,
    },
    employeeName: {
      color: theme.colors.text,
      fontSize: r.font(18),
      fontWeight: "800",
      textAlign: "center",
    },
    employeeCode: {
      marginTop: r.ms(4),
      color: theme.colors.textSecondary,
      fontSize: r.font(13),
    },
    employeeInfoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: r.ms(10),
      paddingVertical: r.ms(10),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    employeeInfoText: {
      flex: 1,
      color: theme.colors.text,
      fontSize: r.font(14),
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: r.ms(8),
      minHeight: 46,
      marginTop: r.ms(16),
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.dangerBg,
    },
    logoutText: {
      color: theme.colors.danger,
      fontSize: r.font(14),
      fontWeight: "700",
    },
    popupHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: r.ms(8),
    },
    popupTitle: {
      fontSize: r.font(17),
      fontWeight: "800",
      color: theme.colors.text,
    },
    emptyText: {
      color: theme.colors.textSecondary,
      fontSize: r.font(14),
      textAlign: "center",
      paddingVertical: r.ms(20),
    },
    notificationItem: {
      paddingVertical: r.ms(10),
      paddingHorizontal: r.ms(10),
      borderRadius: theme.radius.md,
      marginBottom: 4,
    },
    unreadNotificationItem: {
      backgroundColor: theme.colors.primarySoft,
    },
    readNotificationItem: {
      opacity: 0.6,
    },
    notificationTitle: {
      color: theme.colors.text,
      fontSize: r.font(14),
      fontWeight: "600",
    },
    notificationDate: {
      color: theme.colors.textSecondary,
      fontSize: r.font(12),
      marginTop: 4,
    },
  });
};
