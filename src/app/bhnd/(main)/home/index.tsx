import React, { useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProducts } from "../../../../hooks/useProducts";
import { useCart } from "../../../../hooks/useCart";
import { useResponsive } from "../../../../hooks/useResponsive";
import { Header } from "../../../../components/common/Header";
import { useRouter } from "expo-router";
import { SearchBar } from "../../../../components/common/SearchBar";
import { ProductCard } from "../../../../components/product/ProductCard";
import { Loading } from "../../../../components/common/Loading";
import { EmptyState } from "../../../../components/common/EmptyState";
import { theme } from "@/src/styles/theme";

const MAX_CONTENT_WIDTH = 1100; // tablet/màn hình rộng: không giãn hết chiều ngang
const PRODUCTS_PER_CATEGORY = 6; // số sản phẩm tối đa mỗi danh mục khi không tìm kiếm

// Mảng rỗng dùng chung: giữ nguyên tham chiếu giữa các lần render để useMemo không chạy lại
const EMPTY_LIST: any[] = [];

// Bỏ dấu tiếng Việt + đưa về chữ thường để tìm kiếm "ao thun" vẫn ra "Áo thun"
const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim();

type Section = { category: any; products: any[] };

type CategorySectionProps = {
  category: any;
  products: any[];
  styles: ReturnType<typeof createStyles>;
  onAddToCart: (product: any) => void;
  onSeeMore: (category: any) => void;
};

// Mỗi danh mục là một component riêng, bọc memo để không render lại khi
// các danh mục khác hoặc state không liên quan (modal, refreshing) thay đổi
const CategorySection = React.memo(function CategorySection({
  category,
  products,
  styles,
  onAddToCart,
  onSeeMore,
}: CategorySectionProps) {
  return (
    <View style={styles.categoryWrapper}>
      <View style={styles.categoryHeaderContainer}>
        <View style={styles.categoryAccent} />
        <View style={styles.categoryTitleBox}>
          <Text
            style={styles.categoryHeader}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
          >
            {category?.name || "Danh mục"}
          </Text>
          {!!category?.description && (
            <Text
              style={styles.categorySubtext}
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}
            >
              {category.description}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => onSeeMore(category)}
          activeOpacity={0.7}
        >
          <Text style={styles.moreButtonText} maxFontSizeMultiplier={1.2}>
            Xem thêm
          </Text>
          <Ionicons
            name="chevron-forward"
            size={14}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.productItem}>
        {products.map((p, index) => (
          <View
            key={p?._id || `product-${index}`}
            style={styles.productCardWrapper}
          >
            <ProductCard product={p} onAddToCart={onAddToCart} />
          </View>
        ))}
      </View>
    </View>
  );
});

export default function HomeScreen() {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(
    () => createStyles(r, insets),
    [r.width, r.height, insets.bottom, insets.left, insets.right],
  );

  const { products, categories, isLoading, error, getProducts, getCategories } =
    useProducts();
  const { addItem } = useCart();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showFilterModal, setShowFilterModal] = React.useState(false);

  const safeProducts = Array.isArray(products) ? products : EMPTY_LIST;
  const safeCategories = Array.isArray(categories) ? categories : EMPTY_LIST;

  const isSearching = searchQuery.trim().length > 0;

  useEffect(() => {
    getProducts();
    getCategories();
  }, []);

  // Gom nhóm sản phẩm theo danh mục đúng một lần: O(P + C) thay vì O(C × P).
  // Đồng thời áp dụng từ khóa tìm kiếm và bỏ các danh mục không có sản phẩm,
  // nhờ đó ListEmptyComponent hiển thị đúng khi không có kết quả.
  const sections = React.useMemo<Section[]>(() => {
    const keyword = normalizeText(searchQuery);
    const byCategory = new Map<string, any[]>();

    for (const product of safeProducts) {
      const categoryId = product?.categoryid?._id;
      if (!categoryId) continue;
      if (keyword && !normalizeText(product?.name || "").includes(keyword)) {
        continue;
      }
      const list = byCategory.get(categoryId);
      if (list) {
        list.push(product);
      } else {
        byCategory.set(categoryId, [product]);
      }
    }

    const result: Section[] = [];
    for (const category of safeCategories) {
      const list = byCategory.get(category?._id);
      if (!list || list.length === 0) continue;
      result.push({
        category,
        // Khi đang tìm kiếm thì hiện đủ kết quả, không cắt ở 6 sản phẩm
        products: keyword ? list : list.slice(0, PRODUCTS_PER_CATEGORY),
      });
    }
    return result;
  }, [safeProducts, safeCategories, searchQuery]);

  const handleSearch = React.useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Làm mới cả sản phẩm lẫn danh mục
      await Promise.all([getProducts(), getCategories()]);
    } finally {
      setRefreshing(false);
    }
  }, [getProducts, getCategories]);

  const handleAddToCart = React.useCallback(
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

  const handleSeeMore = React.useCallback(
    (category: any) => {
      router.push({
        pathname: "/bhnd/(main)/product",
        params: {
          categoryId: category?._id || "",
          categoryName: category?.name || "",
        },
      });
    },
    [router],
  );

  const toggleFilterModal = React.useCallback(() => {
    setShowFilterModal((prev) => !prev);
  }, []);

  const renderSection = React.useCallback(
    ({ item }: { item: Section }) => (
      <CategorySection
        category={item.category}
        products={item.products}
        styles={styles}
        onAddToCart={handleAddToCart}
        onSeeMore={handleSeeMore}
      />
    ),
    [styles, handleAddToCart, handleSeeMore],
  );

  const keyExtractor = React.useCallback(
    (item: Section, index: number) => item.category?._id || index.toString(),
    [],
  );

  if (isLoading && safeProducts.length === 0) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <Header title="Mua hàng" />

      <View style={styles.searchBarContainer}>
        <View style={{ flex: 1 }}>
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Tìm kiếm sản phẩm..."
          />
        </View>
        {/* <TouchableOpacity
          style={styles.filterButton}
          onPress={toggleFilterModal}
          activeOpacity={0.85}
        >
          <Ionicons name="options-outline" size={16} color="#fff" />
          <Text style={styles.filterButtonText}>Bộ lọc</Text>
        </TouchableOpacity> */}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText} maxFontSizeMultiplier={1.3}>
            {error}
          </Text>
        </View>
      )}

      <FlatList
        data={sections}
        keyExtractor={keyExtractor}
        renderItem={renderSection}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title={
                isSearching ? "Không tìm thấy sản phẩm" : "Chưa có sản phẩm"
              }
              description={
                isSearching
                  ? "Thử một từ khóa tìm kiếm khác"
                  : "Vui lòng quay lại sau"
              }
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
      />

      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={toggleFilterModal}
        supportedOrientations={["portrait", "landscape"]}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={toggleFilterModal}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalCard}
            onPress={() => {}}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} maxFontSizeMultiplier={1.2}>
                Bộ lọc
              </Text>
              <TouchableOpacity
                onPress={toggleFilterModal}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={theme.colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Nội dung bộ lọc sẽ được thêm ở đây */}
            <View style={styles.modalBody} />

            <TouchableOpacity
              style={styles.applyButton}
              onPress={toggleFilterModal}
              activeOpacity={0.85}
            >
              <Text style={styles.applyButtonText} maxFontSizeMultiplier={1.2}>
                Áp dụng
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (
  r: ReturnType<typeof useResponsive>,
  insets: { bottom: number; left: number; right: number },
) => {
  // Số cột theo bề rộng: điện thoại 2, tablet dọc 3, màn rộng/xoay ngang 4
  const columns = r.width >= 1300 ? 4 : r.width >= 700 ? 3 : 2;

  const sideMargin = r.ms(16);
  const gap = r.ms(12);

  // Bề rộng khối danh mục, có trần cho màn hình rất rộng
  const wrapperWidth = Math.min(
    r.width - sideMargin * 2 - insets.left - insets.right,
    MAX_CONTENT_WIDTH,
  );

  // Bề rộng mỗi thẻ sản phẩm. floor để tránh sai số làm rớt xuống hàng
  const cardWidth = Math.floor((wrapperWidth - gap * (columns - 1)) / columns);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    errorContainer: {
      backgroundColor: theme.colors.dangerBg,
      padding: r.ms(12),
      marginHorizontal: r.ms(16),
      marginTop: r.ms(8),
      borderRadius: theme.radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.primaryBorder,
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: r.font(13),
    },
    listContent: {
      paddingTop: r.ms(8),
      paddingBottom: insets.bottom + r.ms(24),
      alignItems: "center", // căn giữa khối danh mục khi có maxWidth
    },
    // Danh mục không còn nằm trong hộp có nền riêng: thẻ sản phẩm trắng
    // nổi trực tiếp trên nền ấm, nhìn thoáng và ít lớp lồng nhau hơn
    categoryWrapper: {
      width: wrapperWidth,
      marginBottom: r.ms(24),
    },
    categoryHeaderContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: r.ms(12),
    },
    categoryAccent: {
      width: 4,
      height: r.ms(22),
      backgroundColor: theme.colors.primary,
      borderRadius: 2,
      marginRight: r.ms(10),
    },
    categoryTitleBox: {
      flex: 1,
    },
    categoryHeader: {
      fontSize: r.font(18),
      fontWeight: "800",
      color: theme.colors.text,
    },
    categorySubtext: {
      fontSize: r.font(12),
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    productItem: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap, // khoảng cách đều giữa các thẻ, cả ngang lẫn dọc
    },
    productCardWrapper: {
      width: cardWidth,
    },
    searchBarContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: r.ms(16),
      // paddingVertical: r.ms(1),
    },
    filterButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      paddingVertical: r.ms(10),
      paddingHorizontal: r.ms(14),
      borderRadius: theme.radius.pill,
      marginLeft: r.ms(10),
    },
    filterButtonText: {
      color: theme.colors.onPrimary,
      marginLeft: 6,
      fontWeight: "700",
      fontSize: r.font(13),
    },
    moreButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.primarySoft,
      paddingVertical: r.ms(6),
      paddingLeft: r.ms(12),
      paddingRight: r.ms(8),
      borderRadius: theme.radius.pill,
      marginLeft: r.ms(10),
    },
    moreButtonText: {
      color: theme.colors.primary,
      fontSize: r.font(12),
      fontWeight: "700",
      marginRight: 2,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      alignItems: "center",
      backgroundColor: theme.colors.overlay,
    },
    modalCard: {
      width: "100%",
      maxWidth: 600, // tablet: bottom sheet không giãn hết chiều ngang
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      paddingHorizontal: r.ms(20),
      paddingTop: r.ms(10),
      paddingBottom: insets.bottom + r.ms(20),
      minHeight: 220,
      maxHeight: r.height * 0.85,
    },
    modalHandle: {
      width: r.ms(40),
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.border,
      alignSelf: "center",
      marginBottom: r.ms(14),
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: r.ms(16),
    },
    modalTitle: {
      fontSize: r.font(17),
      fontWeight: "800",
      color: theme.colors.text,
    },
    modalBody: {
      flex: 1,
    },
    applyButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: r.ms(14),
      borderRadius: theme.radius.md,
      marginTop: r.ms(16),
    },
    applyButtonText: {
      color: theme.colors.onPrimary,
      textAlign: "center",
      fontWeight: "700",
      fontSize: r.font(15),
    },
  });
};
