import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Set item in AsyncStorage
 */
export const setStorageItem = async (key: string, value: any): Promise<void> => {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    try {
      await AsyncStorage.setItem(key, serialized);
    } catch (storageErr: any) {
      console.warn(`AsyncStorage not available for key ${key}:`, storageErr?.message);
      // Fail silently - data is lost but app continues
    }
  } catch (error) {
    console.error(`Failed to set storage item ${key}:`, error);
  }
};

/**
 * Get item from AsyncStorage
 */
export const getStorageItem = async <T = any>(key: string): Promise<T | null> => {
  try {
    try {
      const item = await AsyncStorage.getItem(key);
      if (!item) return null;

      try {
        return JSON.parse(item) as T;
      } catch {
        return item as unknown as T;
      }
    } catch (storageErr: any) {
      console.warn(`AsyncStorage not available for key ${key}:`, storageErr?.message);
      return null;
    }
  } catch (error) {
    console.error(`Failed to get storage item ${key}:`, error);
    return null;
  }
};

/**try {
      await AsyncStorage.removeItem(key);
    } catch (storageErr: any) {
      console.warn(`AsyncStorage not available for key ${key}:`, storageErr?.message);
    }
 * Remove item from AsyncStorage
 */
export const removeStorageItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove storage item ${key}:`, error);
  }
};

/**
 * Ctry {
      await AsyncStorage.clear();
    } catch (storageErr: any) {
      console.warn('AsyncStorage not available:', storageErr?.message);
    }
 */
export const clearStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
};

/**
 * Get multiple items
 */
export const getMultipleStorageItems = async (keys: string[]): Promise<Record<string, any>> => {
  try {
    const result: Record<string, any> = {};

    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        try {
          result[key] = JSON.parse(value);
        } catch {
          result[key] = value;
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Failed to get multiple storage items:', error);
    return {};
  }
};

/**
 * Set multiple items
 */
export const setMultipleStorageItems = async (items: Record<string, any>): Promise<void> => {
  try {
    const promises = Object.entries(items).map(([key, value]) => {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      return AsyncStorage.setItem(key, serialized);
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Failed to set multiple storage items:', error);
  }
};
