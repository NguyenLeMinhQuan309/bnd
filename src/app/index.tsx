import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';

export default function RootIndex() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
        <ActivityIndicator size="large" color="#149eee" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/bhnd/(main)/home" />;
  }

  return <Redirect href="/bhnd/(auth)/login" />;
}
