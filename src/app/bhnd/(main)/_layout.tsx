import React, { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/src/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/src/styles/theme";
import { useResponsive } from "@/src/hooks/useResponsive";

export default function MainLayout() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const getTabIconSize = (size: number) =>
    responsive.isTablet ? size : responsive.font(size);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/bhnd/(auth)/login");
    }
  }, [isAuthenticated, router]);

  // If not authenticated, don't render the navigator
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0, // bỏ đường kẻ cứng, dùng bóng đổ nhẹ để tách khỏi nội dung
          paddingBottom: insets.bottom,
          paddingTop: responsive.ms(6),
          height: responsive.ms(66) + insets.bottom,
          ...theme.shadow.raised,
        },
        tabBarLabelStyle: {
          fontSize: responsive.font(10),
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: "Mua hàng",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={getTabIconSize(size)}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="product"
        options={{
          tabBarLabel: "Sản phẩm",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "cube" : "cube-outline"}
              size={getTabIconSize(size)}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          tabBarLabel: "Giỏ hàng",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "cart" : "cart-outline"}
              size={getTabIconSize(size)}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarLabel: "Đơn hàng",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "receipt" : "receipt-outline"}
              size={getTabIconSize(size)}
              color={color}
            />
          ),
        }}
      />
      {/* <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: "Hồ sơ",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={getTabIconSize(size)}
              color={color}
            />
          ),
        }}
      /> */}
    </Tabs>
  );
}
