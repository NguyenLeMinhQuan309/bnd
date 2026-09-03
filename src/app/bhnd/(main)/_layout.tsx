import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import HomeScreen from './home';
import ProductScreen from './product';
import CartScreen from './cart';
import OrdersScreen from './orders';
import ProfileScreen from './profile';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'product') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#149eee',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        
      })}
    >
      <Tab.Screen 
        name="home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Mua hàng' }}
      />
      <Tab.Screen 
        name="product" 
        component={ProductScreen}
        options={{ tabBarLabel: 'Sản phẩm' }}
      />
      <Tab.Screen 
        name="cart" 
        component={CartScreen}
        options={{ tabBarLabel: 'Giỏ hàng' }}
      />
      <Tab.Screen 
        name="orders" 
        component={OrdersScreen}
        options={{ tabBarLabel: 'Đơn hàng' }}
      />
      <Tab.Screen 
        name="profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Hồ sơ' }}
      />
    </Tab.Navigator>
  );
}

export default function MainLayout() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/bhnd/(auth)/login');
    }
  }, [isAuthenticated, router]);

  // If not authenticated, don't render the navigator
  if (!isAuthenticated) {
    return null;
  }

  return <MainNavigator />;
}
