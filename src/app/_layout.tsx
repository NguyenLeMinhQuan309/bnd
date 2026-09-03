import React from 'react';
import { Slot } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { AppProvider } from '../context/AppContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppProvider>
          <Slot />
        </AppProvider>
      </CartProvider>
    </AuthProvider>
  );
}
