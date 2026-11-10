import React, { useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@/src/hooks/useAuth";
import { useUser } from "@/src/hooks/useUser";
import { Header } from "@/src/components/common/Header";
import { Button } from "@/src/components/common/Button";
import { Loading } from "@/src/components/common/Loading";
import { getCustomerImageUrl } from "@/src/services/imageService";
import { theme } from "@/src/styles/theme";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { profile, fetchProfile, isLoading } = useUser();
  const imageUrl = getCustomerImageUrl(user?.code || "");
  useEffect(() => {
    fetchProfile();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header title="Thông tin cá nhân" />

      <View style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.banner} />
          <View style={styles.avatarRing}>
            <Image source={{ uri: imageUrl }} style={styles.avatar} />
          </View>
          <Text style={styles.name}>
            {profile?.name || user?.name || "User"}
          </Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="person-outline"
            label="Xem thông tin cá nhân"
            onPress={() => {
              // Navigate to edit profile
            }}
          />
          <MenuItem
            icon="location-outline"
            label="Quản lý địa chỉ"
            onPress={() => {
              // Navigate to addresses
            }}
          />
          <MenuItem
            icon="heart-outline"
            label="Sản phẩm yêu thích"
            onPress={() => {
              // Navigate to favorites
            }}
          />
          <MenuItem
            icon="receipt-outline"
            label="Đơn hàng của tôi"
            last
            onPress={() => {
              // Navigate to orders
            }}
          />
        </View>

        <View style={styles.menuSection}>
          <MenuItem
            icon="notifications-outline"
            label="Thông báo"
            onPress={() => {
              // Navigate to notifications
            }}
          />
          <MenuItem
            icon="information-circle-outline"
            label="Giới thiệu"
            onPress={() => {
              // Navigate to about
            }}
          />
          <MenuItem
            icon="call-outline"
            label="Hỗ trợ"
            last
            onPress={() => {
              // Navigate to support
            }}
          />
        </View>

        <Button
          label="Đăng xuất"
          onPress={logout}
          variant="destructive"
          style={styles.logoutButton}
        />
      </View>
    </ScrollView>
  );
}

interface MenuItemProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  last?: boolean;
  onPress?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, last, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.menuItem, last && styles.menuItemLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuIconBox}>
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={theme.colors.textMuted}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeader: {
    alignItems: "center",
    paddingBottom: 24,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    marginBottom: 16,
    overflow: "hidden",
    ...theme.shadow.card,
  },
  // Dải đỏ phía sau avatar: điểm nhấn thương hiệu duy nhất của màn hình này
  banner: {
    width: "100%",
    height: 96,
    backgroundColor: theme.colors.primary,
  },
  avatarRing: {
    marginTop: -56,
    padding: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    marginBottom: 12,
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: theme.colors.surfaceMuted,
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
  },
  email: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  menuSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md - 2,
    backgroundColor: theme.colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  logoutButton: {
    marginTop: 8,
  },
});
