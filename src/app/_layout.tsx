import React from "react";
import { Slot } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { AppProvider } from "../context/AppContext";
import { NotificationProvider } from "../hooks/useNotification";

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>
          <AppProvider>
            <Slot />
          </AppProvider>
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
