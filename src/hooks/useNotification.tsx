import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../styles/theme";
import { useResponsive } from "./useResponsive";

// ============================================================================
// Kiểu dữ liệu
// ============================================================================

export type NotificationType = "success" | "error" | "warning" | "info";

export interface ShowNotificationOptions {
  message: string;
  title?: string;
  type?: NotificationType;
  /** ms. Mặc định theo loại. Đặt 0 để giữ đến khi người dùng chạm vào. */
  duration?: number;
}

type ExtraOptions = Omit<ShowNotificationOptions, "message" | "type">;

export type RunResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: unknown };

export interface RunMessages<T> {
  /** Thông báo khi thành công. Có thể là hàm nhận kết quả trả về. */
  success?: string | ((data: T) => string);
  /**
   * Thông báo khi thất bại.
   * - string: dùng làm tiêu đề, nội dung là message lỗi từ server/exception (nếu có)
   * - hàm: tự dựng toàn bộ nội dung từ lỗi
   */
  error?: string | ((error: unknown) => string);
}

interface NotificationContextValue {
  show: (options: ShowNotificationOptions) => string;
  success: (message: string, options?: ExtraOptions) => string;
  error: (message: string, options?: ExtraOptions) => string;
  warning: (message: string, options?: ExtraOptions) => string;
  info: (message: string, options?: ExtraOptions) => string;
  hide: (id: string) => void;
  hideAll: () => void;
  /**
   * Chạy một tác vụ bất đồng bộ và tự báo thành công / thất bại.
   * Không ném lỗi ra ngoài: trả về { ok, data } hoặc { ok: false, error }.
   */
  run: <T>(
    task: Promise<T> | (() => Promise<T>),
    messages?: RunMessages<T>,
  ) => Promise<RunResult<T>>;
}

interface ToastItem {
  id: string;
  key: string; // dùng để gộp thông báo trùng
  type: NotificationType;
  title?: string;
  message: string;
  leaving: boolean;
}

// ============================================================================
// Cấu hình
// ============================================================================

const MAX_VISIBLE = 3;

const DEFAULT_DURATION: Record<NotificationType, number> = {
  success: 2500,
  info: 3000,
  warning: 3500,
  error: 4000,
};

const DEFAULT_ERROR_MESSAGE = "Có lỗi xảy ra, vui lòng thử lại.";

const TYPE_STYLE: Record<
  NotificationType,
  { icon: React.ComponentProps<typeof Ionicons>["name"]; color: string; bg: string }
> = {
  success: { icon: "checkmark-circle", color: theme.colors.success, bg: "#E6F4EA" },
  error: { icon: "close-circle", color: theme.colors.danger, bg: theme.colors.dangerBg },
  warning: { icon: "warning", color: "#B87503", bg: "#FEF3E0" },
  info: { icon: "information-circle", color: "#1565C0", bg: "#E3F2FD" },
};

const getErrorMessage = (error: unknown): string | undefined => {
  if (!error) return undefined;
  if (typeof error === "string") return error;
  const e = error as any;
  return e?.response?.data?.message || e?.message || undefined;
};

// ============================================================================
// Context + hook
// ============================================================================

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotification(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotification phải được dùng bên trong <NotificationProvider> (thêm vào app/_layout.tsx)",
    );
  }
  return ctx;
}

// ============================================================================
// Provider
// ============================================================================

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItemsState] = useState<ToastItem[]>([]);
  // Bản sao đồng bộ của danh sách: để kiểm tra trùng lặp ngay lập tức,
  // không phụ thuộc thời điểm React chạy hàm cập nhật state
  const itemsRef = useRef<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const counter = useRef(0);

  const setItems = useCallback(
    (updater: (prev: ToastItem[]) => ToastItem[]) => {
      itemsRef.current = updater(itemsRef.current);
      setItemsState(itemsRef.current);
    },
    [],
  );

  const clearTimer = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  // Đánh dấu "đang rời đi" để toast tự chạy animation ra, rồi mới xoá khỏi state
  const hide = useCallback(
    (id: string) => {
      clearTimer(id);
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, leaving: true } : it)),
      );
    },
    [clearTimer, setItems],
  );

  const remove = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((it) => it.id !== id));
    },
    [setItems],
  );

  const hideAll = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
    setItems((prev) => prev.map((it) => ({ ...it, leaving: true })));
  }, [setItems]);

  const scheduleHide = useCallback(
    (id: string, duration: number) => {
      clearTimer(id);
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => hide(id), duration),
        );
      }
    },
    [clearTimer, hide],
  );

  const show = useCallback(
    ({ message, title, type = "info", duration }: ShowNotificationOptions) => {
      const key = `${type}|${title ?? ""}|${message}`;
      const ms = duration ?? DEFAULT_DURATION[type];

      // Thông báo y hệt đang hiện (ví dụ bấm liên tục): chỉ gia hạn, không xếp chồng
      const existing = itemsRef.current.find(
        (it) => it.key === key && !it.leaving,
      );
      if (existing) {
        scheduleHide(existing.id, ms);
        return existing.id;
      }

      counter.current += 1;
      const id = `n${Date.now()}-${counter.current}`;

      setItems((prev) => {
        const next = [...prev, { id, key, type, title, message, leaving: false }];
        // Quá số lượng cho phép: đẩy các toast cũ nhất ra
        const visible = next.filter((it) => !it.leaving);
        const overflow = visible.length - MAX_VISIBLE;
        if (overflow > 0) {
          const dropIds = new Set(visible.slice(0, overflow).map((it) => it.id));
          dropIds.forEach((d) => clearTimer(d));
          return next.map((it) =>
            dropIds.has(it.id) ? { ...it, leaving: true } : it,
          );
        }
        return next;
      });

      scheduleHide(id, ms);

      // Đọc to cho người dùng trình đọc màn hình
      AccessibilityInfo.announceForAccessibility(
        title ? `${title}. ${message}` : message,
      );

      return id;
    },
    [clearTimer, scheduleHide, setItems],
  );

  const success = useCallback(
    (message: string, options?: ExtraOptions) =>
      show({ ...options, message, type: "success" }),
    [show],
  );
  const error = useCallback(
    (message: string, options?: ExtraOptions) =>
      show({ ...options, message, type: "error" }),
    [show],
  );
  const warning = useCallback(
    (message: string, options?: ExtraOptions) =>
      show({ ...options, message, type: "warning" }),
    [show],
  );
  const info = useCallback(
    (message: string, options?: ExtraOptions) =>
      show({ ...options, message, type: "info" }),
    [show],
  );

  const run = useCallback(
    async <T,>(
      task: Promise<T> | (() => Promise<T>),
      messages: RunMessages<T> = {},
    ): Promise<RunResult<T>> => {
      try {
        const data = await (typeof task === "function" ? task() : task);
        if (messages.success) {
          success(
            typeof messages.success === "function"
              ? messages.success(data)
              : messages.success,
          );
        }
        return { ok: true, data };
      } catch (err) {
        const custom = messages.error;
        if (typeof custom === "function") {
          error(custom(err));
        } else {
          const detail = getErrorMessage(err);
          if (custom && detail && detail !== custom) {
            error(detail, { title: custom });
          } else {
            error(custom || detail || DEFAULT_ERROR_MESSAGE);
          }
        }
        return { ok: false, error: err };
      }
    },
    [success, error],
  );

  // Dọn timer khi provider bị huỷ
  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  // value ổn định: các component dùng hook KHÔNG bị render lại mỗi khi có toast mới
  const value = useMemo<NotificationContextValue>(
    () => ({ show, success, error, warning, info, hide, hideAll, run }),
    [show, success, error, warning, info, hide, hideAll, run],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastHost items={items} onPress={hide} onExited={remove} />
    </NotificationContext.Provider>
  );
};

// ============================================================================
// Giao diện
// ============================================================================

const ToastHost: React.FC<{
  items: ToastItem[];
  onPress: (id: string) => void;
  onExited: (id: string) => void;
}> = ({ items, onPress, onExited }) => {
  const r = useResponsive();
  const insets = useSafeAreaInsets();

  const styles = useMemo(
    () => createStyles(r, insets),
    [r.width, r.height, insets.top, insets.left, insets.right],
  );

  if (items.length === 0) return null;

  return (
    // box-none: vùng trống không chặn thao tác cảm ứng của màn hình bên dưới
    <View pointerEvents="box-none" style={styles.host}>
      {items.map((item) => (
        <ToastView
          key={item.id}
          item={item}
          styles={styles}
          iconSize={r.ms(22)}
          onPress={onPress}
          onExited={onExited}
        />
      ))}
    </View>
  );
};

const ToastView: React.FC<{
  item: ToastItem;
  styles: ReturnType<typeof createStyles>;
  iconSize: number;
  onPress: (id: string) => void;
  onExited: (id: string) => void;
}> = ({ item, styles, iconSize, onPress, onExited }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const look = TYPE_STYLE[item.type];

  // Vào: trượt xuống + hiện dần
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  // Ra: mờ dần + trượt lên, xong thì báo provider xoá khỏi danh sách
  useEffect(() => {
    if (!item.leaving) return;
    Animated.timing(anim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onExited(item.id);
    });
  }, [item.leaving, item.id, anim, onExited]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [-16, 0],
            }),
          },
        ],
      }}
    >
      <Pressable
        onPress={() => onPress(item.id)}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[
          styles.toast,
          { backgroundColor: look.bg, borderLeftColor: look.color },
        ]}
      >
        <Ionicons name={look.icon} size={iconSize} color={look.color} />
        <View style={styles.textWrap}>
          {!!item.title && (
            <Text style={styles.title} maxFontSizeMultiplier={1.2}>
              {item.title}
            </Text>
          )}
          <Text style={styles.message} maxFontSizeMultiplier={1.3}>
            {item.message}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const createStyles = (
  r: ReturnType<typeof useResponsive>,
  insets: { top: number; left: number; right: number },
) => {
  const side = r.ms(12);
  // Điện thoại: gần full bề ngang. Tablet: giới hạn 480dp, căn giữa.
  const maxWidth = Math.min(r.width - insets.left - insets.right - side * 2, 480);

  return StyleSheet.create({
    host: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      alignItems: "center",
      paddingTop: insets.top + r.ms(8),
      paddingLeft: insets.left + side,
      paddingRight: insets.right + side,
      gap: r.ms(8),
      zIndex: 9999,
      elevation: 9999, // Android: nổi trên mọi thành phần khác
    },
    toast: {
      width: maxWidth,
      flexDirection: "row",
      alignItems: "center",
      gap: r.ms(10),
      paddingVertical: r.ms(12),
      paddingHorizontal: r.ms(14),
      minHeight: 48,
      borderRadius: 12,
      borderLeftWidth: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 6,
    },
    textWrap: {
      flex: 1,
    },
    title: {
      fontSize: r.font(14),
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: 2,
    },
    message: {
      fontSize: r.font(13),
      lineHeight: Math.round(r.font(13) * 1.4),
      color: theme.colors.text,
    },
  });
};
