// Để dùng địa chỉ local dev, hãy set biến môi trường EXPO_PUBLIC_API_BASE_URL
// ví dụ: EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:3001

export const URL_API =
  (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.11.20.45:3001')
    .replace(/\/+$/, '');