import React, { useEffect, useMemo, useState, useCallback, memo } from "react";
import {
  View,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useProducts } from "../../../../hooks/useProducts";
import { useCart } from "../../../../hooks/useCart";
import { Header } from "../../../../components/common/Header";
import { ProductCard } from "../../../../components/product/ProductCard";
import { ProductList } from "../../../../components/product/ProductList";
import { Loading } from "../../../../components/common/Loading";
import { EmptyState } from "../../../../components/common/EmptyState";
import { useLocalSearchParams } from "expo-router";
import { theme } from "@/src/styles/theme";
import { useResponsive } from "@/src/hooks/useResponsive";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MAX_CONTENT_WIDTH = 1200;

// Mảng rỗng dùng chung: giữ nguyên tham chiếu giữa các lần render để useMemo không chạy lại
const EMPTY_LIST: any[] = [];

type ProductScreenStyles = ReturnType<typeof createStyles>;

// Tham số từ expo-router có thể là string hoặc string[]
const firstParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const ProductListRow = memo(function ProductListRow({
  item,
  viewMode,
  onAddToCart,
  styles,
}: {
  item: any;
  viewMode: "card" | "list";
  onAddToCart: (product: any) => void;
  styles: ProductScreenStyles;
}) {
  const handleAdd = useCallback(() => onAddToCart(item), [onAddToCart, item]);

  return (
    <View style={viewMode === "card" ? styles.cardWrapper : styles.listWrapper}>
      {viewMode === "card" ? (
        <ProductCard product={item} onAddToCart={handleAdd} />
      ) : (
        <ProductList product={item} onAddToCart={handleAdd} />
      )}
    </View>
  );
});

// Một dòng lựa chọn danh mục trong modal ("Tất cả" cũng dùng chung component này)
const CategoryOption = memo(function CategoryOption({
  id,
  label,
  isActive,
  onSelect,
  styles,
}: {
  id: string | null;
  label: string;
  isActive: boolean;
  onSelect: (id: string | null) => void;
  styles: ProductScreenStyles;
}) {
  return (
    <TouchableOpacity
      style={[styles.optionItem, isActive && styles.optionItemActive]}
      onPress={() => onSelect(id)}
      activeOpacity={0.7}
    >
      <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
        {label}
      </Text>
      {isActive && (
        <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );
});

export default function ProductScreen() {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const columns = r.width >= 1300 ? 4 : r.width >= 700 ? 3 : 2;
  const styles = useMemo(
    () => createStyles(r, insets, columns),
    [r.width, r.height, insets.bottom, insets.left, insets.right, columns],
  );

  const { products, categories, isLoading, error, getProducts, getCategories } =
    useProducts();
  const { addItem } = useCart();
  const params = useLocalSearchParams<{
    categoryId?: string | string[];
    categoryName?: string | string[];
  }>();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  const safeProducts = Array.isArray(products) ? products : EMPTY_LIST;
  const safeCategories = Array.isArray(categories) ? categories : EMPTY_LIST;

  const categoryIdFromQuery = firstParam(params.categoryId);
  const categoryNameFromQuery = firstParam(params.categoryName);

  useEffect(() => {
    void getProducts();
    void getCategories();
  }, [getCategories, getProducts]);

  useEffect(() => {
    setSelectedCategoryId(categoryIdFromQuery || null);
  }, [categoryIdFromQuery]);

  const selectedCategoryLabel = useMemo(() => {
    if (!selectedCategoryId) {
      return "Tất cả danh mục";
    }

    const matchedCategory = safeCategories.find(
      (category) => category?._id === selectedCategoryId,
    );
    return matchedCategory?.name || categoryNameFromQuery || "Danh mục";
  }, [categoryNameFromQuery, safeCategories, selectedCategoryId]);

  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId) {
      return safeProducts;
    }

    return safeProducts.filter((product) => {
      const categoryId = product?.categoryid?._id || product?.category?._id;
      return categoryId === selectedCategoryId;
    });
  }, [safeProducts, selectedCategoryId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([getProducts(), getCategories()]);
    } finally {
      setRefreshing(false);
    }
  }, [getProducts, getCategories]);

  // Trước đây hàm này không làm gì cả; giờ thêm sản phẩm vào giỏ như ở màn hình Mua hàng
  const handleAddToCart = useCallback(
    async (product: any) => {
      try {
        await addItem(
          product._id,
          1,
          product.prices?.[0]?.price || product.price || 0,
        );
        Alert.alert("Thành công", `${product.name} đã được thêm vào giỏ hàng!`);
      } catch (err: any) {
        Alert.alert(
          "Lỗi",
          err.message || "Không thể thêm sản phẩm vào giỏ hàng",
        );
      }
    },
    [addItem],
  );

  const openCategoryMenu = useCallback(() => setShowCategoryMenu(true), []);
  const closeCategoryMenu = useCallback(() => setShowCategoryMenu(false), []);

  const selectCategory = useCallback((id: string | null) => {
    setSelectedCategoryId(id);
    setShowCategoryMenu(false);
  }, []);

  const keyExtractor = useCallback(
    (item: any, index: number) => item?._id || `product-${index}`,
    [],
  );

  // `styles` phải nằm trong deps, nếu không khi xoay màn hình hoặc đổi kích thước
  // các hàng sản phẩm vẫn dùng bề rộng thẻ cũ
  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <ProductListRow
        item={item}
        viewMode={viewMode}
        onAddToCart={handleAddToCart}
        styles={styles}
      />
    ),
    [viewMode, handleAddToCart, styles],
  );

  if (isLoading && safeProducts.length === 0) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <Header title="Sản phẩm" />

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.combobox}
          onPress={openCategoryMenu}
          activeOpacity={0.8}
        >
          <Ionicons
            name="pricetag-outline"
            size={15}
            color={theme.colors.primary}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.comboboxText} numberOfLines={1}>
            {selectedCategoryLabel}
          </Text>
          <Ionicons
            name="chevron-down"
            size={16}
            color={theme.colors.textMuted}
          />
        </TouchableOpacity>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === "card" && styles.toggleButtonActive,
            ]}
            onPress={() => setViewMode("card")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="grid"
              size={16}
              color={
                viewMode === "card"
                  ? theme.colors.onPrimary
                  : theme.colors.textMuted
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === "list" && styles.toggleButtonActive,
            ]}
            onPress={() => setViewMode("list")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="list"
              size={16}
              color={
                viewMode === "list"
                  ? theme.colors.onPrimary
                  : theme.colors.textMuted
              }
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.wrapper}>
        <FlatList
          key={`${viewMode}-${columns}`}
          data={filteredProducts}
          keyExtractor={keyExtractor}
          numColumns={viewMode === "card" ? columns : 1}
          columnWrapperStyle={viewMode === "card" ? styles.row : undefined}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          renderItem={renderItem}
          ListEmptyComponent={
            !isLoading ? (
              <EmptyState
                title="Không có sản phẩm"
                description="Hãy quay lại sau để xem thêm sản phẩm mới"
              />
            ) : null
          }
        />
      </View>
      <Modal
        visible={showCategoryMenu}
        transparent
        animationType="slide"
        onRequestClose={closeCategoryMenu}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeCategoryMenu}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalCard}
            onPress={() => {}}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Chọn danh mục</Text>
              <TouchableOpacity
                onPress={closeCategoryMenu}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={theme.colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* ScrollView để danh sách dài vẫn cuộn được trong giới hạn chiều cao của modal */}
            <ScrollView showsVerticalScrollIndicator={false}>
              <CategoryOption
                id={null}
                label="Tất cả"
                isActive={!selectedCategoryId}
                onSelect={selectCategory}
                styles={styles}
              />
              {safeCategories.map((category, index) => (
                <CategoryOption
                  key={category?._id || category?.name || `category-${index}`}
                  id={category?._id || null}
                  label={category?.name || "Danh mục"}
                  isActive={selectedCategoryId === category?._id}
                  onSelect={selectCategory}
                  styles={styles}
                />
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (
  r: ReturnType<typeof useResponsive>,
  insets: { bottom: number; left: number; right: number },
  columns: number,
) => {
  const sideMargin = r.ms(16);
  const gap = r.ms(12);
  const contentWidth = Math.min(
    Math.max(0, r.width - sideMargin * 2 - insets.left - insets.right),
    MAX_CONTENT_WIDTH,
  );
  const cardWidth = Math.floor((contentWidth - gap * (columns - 1)) / columns);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    errorContainer: {
      width: contentWidth,
      alignSelf: "center",
      marginTop: r.ms(8),
      padding: r.ms(12),
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.dangerBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.primaryBorder,
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: r.font(13),
    },
    toolbar: {
      width: contentWidth,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: r.ms(12),
      gap,
    },
    combobox: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      paddingHorizontal: r.ms(14),
      paddingVertical: r.ms(11),
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    comboboxText: {
      color: theme.colors.text,
      fontSize: r.font(13),
      fontWeight: "600",
      flex: 1,
    },
    // Danh sách sản phẩm nằm trực tiếp trên nền, không còn hộp bao ngoài
    wrapper: {
      flex: 1,
      width: contentWidth,
      alignSelf: "center",
    },
    toggleRow: {
      flexDirection: "row",
      gap: r.ms(4),
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      padding: r.ms(3),
      borderRadius: theme.radius.md,
    },
    toggleButton: {
      width: r.ms(34),
      height: r.ms(34),
      borderRadius: theme.radius.sm,
      justifyContent: "center",
      alignItems: "center",
    },
    toggleButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    listContent: {
      paddingTop: r.ms(4),
      paddingBottom: insets.bottom + r.ms(24),
    },
    row: {
      gap,
    },
    cardWrapper: {
      width: cardWidth,
      marginBottom: gap,
    },
    listWrapper: {
      width: "100%",
      marginBottom: r.ms(10),
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      alignItems: "center",
      backgroundColor: theme.colors.overlay,
    },
    modalCard: {
      width: "100%",
      maxWidth: 640,
      maxHeight: r.height * 0.7,
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      paddingHorizontal: r.ms(18),
      paddingTop: r.ms(10),
      paddingBottom: insets.bottom + r.ms(24),
    },
    modalHandle: {
      width: r.ms(40),
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.border,
      alignSelf: "center",
      marginBottom: r.ms(14),
    },
    modalHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: r.ms(8),
    },
    modalTitle: {
      fontSize: r.font(17),
      fontWeight: "800",
      color: theme.colors.text,
    },
    optionItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: r.ms(13),
      paddingHorizontal: r.ms(12),
      borderRadius: theme.radius.md,
    },
    optionItemActive: {
      backgroundColor: theme.colors.primarySoft,
    },
    optionText: {
      color: theme.colors.text,
      fontSize: r.font(14),
      fontWeight: "500",
    },
    optionTextActive: {
      color: theme.colors.primary,
      fontWeight: "700",
    },
  });
};
