import { ViewStyle } from "react-native";

// Bảng màu giữ nguyên tông đỏ thương hiệu (#f10e0e), phối lại với nền trung tính ấm
// thay cho xám lạnh: nền nhìn mềm hơn, thẻ trắng nổi bật hơn, đỏ chỉ dùng cho điểm nhấn.
export const theme = {
  colors: {
    primary: "#008f00", // màu chủ đạo: nút chính, giá, tab đang chọn
    primaryDark: "#005a00", // trạng thái nhấn / đậm hơn
    primarySoft: "#F0FDF0", // nền nhạt của icon, mục đang chọn, nút phụ
    primaryBorder: "#C9F0C9", // viền nhạt tông xanh

    background: "#F7F5F5", // nền màn hình
    surface: "#FFFFFF", // thẻ, thanh tab, modal
    surfaceMuted: "#F2EEEE", // nền ô nhập, stepper, chip không chọn
    border: "#ECE6E6",

    text: "#211A1B",
    textSecondary: "#6F6567",
    textMuted: "#A69C9E",
    onPrimary: "#FFFFFF",

    success: "#1F9D55",
    dangerBg: "#FFF1F0",
    danger: "#D92D20",
    overlay: "rgba(24, 12, 12, 0.45)",
  },

  // Bo góc theo cấp bậc: thẻ lớn > nút > chip
  radius: {
    xs: 8,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    pill: 999,
  },

  shadow: {
    card: {
      shadowColor: "#2A0A0A",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    } as ViewStyle,
    raised: {
      shadowColor: "#2A0A0A",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
      elevation: 8,
    } as ViewStyle,
  },
};

export type Theme = typeof theme;