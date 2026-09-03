import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import {useRouter} from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { useUser } from '@/src/hooks/useUser';
import { Header } from '@/src/components/common/Header';
import { Button } from '@/src/components/common/Button';
import { Loading } from '@/src/components/common/Loading';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser } from '@/src/types';
import { URL_API } from '@/src/services/URL';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { profile, fetchProfile, isLoading } = useUser();
  const router = useRouter();
  const [storedUser, setStoredUser] = useState<AuthUser | null>(null);
  const API_BASE_URL = URL_API;
  const imageUrl = `${API_BASE_URL}/images_nhanvien/${storedUser?.code}.jpg`;
  useEffect(() => {
    const fetchUserFromStorage = async () => {
      try {
        const user = await AsyncStorage.getItem('user');
        if (user) {
          const parsedUser = JSON.parse(user);
          setStoredUser(parsedUser);
          console.log('User retrieved from AsyncStorage:', parsedUser);
        }
      } catch (error) {
        console.error('Failed to retrieve user from AsyncStorage:', error);
      }
    };

    fetchUserFromStorage();
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
          <Image
            source={{ uri: imageUrl }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{profile?.name || storedUser?.name || 'User'}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="⚙️"
            label="Xem thông tin cá nhân"
            onPress={() => {
              // Navigate to edit profile
            }}
          />
          <MenuItem
            icon="📍"
            label="Quản lý địa chỉ"
            onPress={() => {
              // Navigate to addresses
            }}
          />
          <MenuItem
            icon="❤️"
            label="Sản phẩm yêu thích"
            onPress={() => {
              // Navigate to favorites
            }}
          />
          <MenuItem
            icon="📦"
            label="Đơn hàng của tôi"
            onPress={() => {
              // Navigate to orders
            }}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingsSection}>
          <MenuItem
            icon="🔒"
            label="Đổi mật khẩu"
            onPress={() => {
              router.replace('/bhnd/(main)/profile/change-password');
            }}
          />
          <MenuItem
            icon="🔔"
            label="Thông báo"
            onPress={() => {
              // Navigate to notifications
            }}
          />
          <MenuItem
            icon="ℹ️"
            label="Giới thiệu"
            onPress={() => {
              // Navigate to about
            }}
          />
          <MenuItem
            icon="📞"
            label="Hỗ trợ"
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
  icon: string;
  label: string;
  onPress?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress }) => {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#cecece',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
  },
  email: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  settingsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  menuArrow: {
    fontSize: 18,
    color: '#999999',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginVertical: 8,
  },
  logoutButton: {
    marginTop: 24,
  },
});
