import { useWindowDimensions, PixelRatio } from 'react-native';

// Kích thước màn hình dùng để thiết kế (cạnh ngắn, đơn vị dp)
const BASE_SHORT_SIDE = 375;

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  // Dùng cạnh ngắn để khi xoay ngang, kích thước không bị phóng to bất thường
  const shortSide = Math.min(width, height);

  const scale = (size: number) => (shortSide / BASE_SHORT_SIDE) * size;

  // Scale "nhẹ": tablet không bị to quá đà. Dùng cho font, padding, margin
  const ms = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

  const font = (size: number) =>
    Math.round(PixelRatio.roundToNearestPixel(ms(size)));

  return {
    width,
    height,
    isTablet: shortSide >= 600,
    isLandscape: width > height,
    scale,
    ms,
    font,
  };
}