import { useState, useCallback } from 'react';
import { UserProfile, UserAddress } from '../types';
import { userService } from '../services/userService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useUser = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await userService.getProfile();
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);

      const updated = await userService.updateProfile(data);
      setProfile(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAddresses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await userService.getAddresses();
      setAddresses(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch addresses');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addAddress = useCallback(
    async (data: any) => {
      try {
        setIsLoading(true);
        setError(null);

        const newAddress = await userService.createAddress(data);
        setAddresses((prev) => [...prev, newAddress]);
      } catch (err: any) {
        setError(err.message || 'Failed to add address');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateAddress = useCallback(
    async (id: string, data: any) => {
      try {
        setIsLoading(true);
        setError(null);

        const updated = await userService.updateAddress(id, data);
        setAddresses((prev) => prev.map((addr) => (addr.id === id ? updated : addr)));
      } catch (err: any) {
        setError(err.message || 'Failed to update address');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteAddress = useCallback(
    async (id: string) => {
      try {
        setIsLoading(true);
        setError(null);

        await userService.deleteAddress(id);
        setAddresses((prev) => prev.filter((addr) => addr.id !== id));
      } catch (err: any) {
        setError(err.message || 'Failed to delete address');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const fetchUserFromStorage = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setProfile(parsedUser);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve user from AsyncStorage');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    profile,
    addresses,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    fetchAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    fetchUserFromStorage, // Added fetchUserFromStorage to the return object
  };
};
