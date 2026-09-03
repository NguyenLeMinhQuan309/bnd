# Ứng Dụng Thương Mại Điện Tử - React Native + Expo

## I. Tổng Quan Dự Án

**Tên Ứng Dụng:** Bannoidia E-Commerce  
**Nền Tảng:** iOS & Android  
**Công Nghệ:** React Native, Expo, React Router  
**Phiên Bản React:** 19.1.0  
**Phiên Bản React Native:** 0.81.5

---

## II. Các Chức Năng Chính

### 1. **Xác Thực & Tài Khoản**

- ✅ Đăng nhập

### 2. **Browsing & Tìm Kiếm**

- ✅ Danh sách sản phẩm
- ✅ Chi tiết sản phẩm
- ✅ Tìm kiếm sản phẩm
- ✅ Lọc theo danh mục/giá/rating

### 3. **Giỏ Hàng**

- ✅ Thêm/xoá sản phẩm
- ✅ Cập nhật số lượng
- ✅ Lưu sản phẩm yêu thích
- ✅ Hiển thị tổng tiền

### 4. **Đặt Hàng**

- ✅ Chọn địa chỉ giao hàng
- ✅ Chọn phương thức thanh toán
- ✅ Xác nhận đơn hàng
- ✅ Mã giảm giá / Mã promo

### 5. **Quản Lý Đơn Hàng Cá Nhân**

- ✅ Danh sách đơn hàng
- ✅ Chi tiết đơn hàng
- ✅ Trạng thái đơn hàng (Chờ, Vận chuyển, Nhận được, Hủy)
- ✅ Theo dõi vị trí giao hàng (Real-time tracking)
- ✅ Hủy đơn hàng
- ✅ Trả hàng/Hoàn tiền

### 6. **Thông Tin Cá Nhân**

- ✅ Xem hồ sơ
- ✅ Sửa thông tin (Tên, Email, Điện thoại)
- ✅ Quản lý địa chỉ
- ✅ Lịch sử mua hàng

### 7. **Bảo Mật & Cài Đặt**

- ✅ Đổi mật khẩu
- ✅ Xác minh hai yếu tố (2FA)
- ✅ Cài đặt thông báo
- ✅ Đăng xuất

---

## III. Cấu Trúc Điều Hướng (Navigation Structure)

```
App (Root)
├── Auth Stack
│   ├── LoginScreen
|
│
├── Main Stack (Authenticated Users)
│   ├── Home Navigation (Tab)
│   │   ├── HomeScreen
│   │   ├── ProductDetailScreen
│   │   └── SearchScreen
│   │
│   ├── Cart Navigation (Tab)
│   │   ├── CartScreen
│   │   └── CheckoutScreen
│   │
│   ├── Orders Navigation (Tab)
│   │   ├── OrderListScreen
│   │   ├── OrderDetailScreen
│   │   └── TrackingScreen
│   │
│   └── Profile Navigation (Tab)
│       ├── ProfileScreen
│       ├── EditProfileScreen
│       ├── AddressManagementScreen
│       ├── ChangePasswordScreen
│       └── SettingsScreen
```

---

## IV. Cấu Trúc Thư Mục Dự Án

```
bannoidia/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │
│   │
│   │
│   ├── (main)/
│   │   ├── _layout.tsx
│   │   ├── home/
│   │   │   ├── index.tsx
│   │   │   ├── product-detail/[id].tsx
│   │   │   └── search.tsx
│   │   ├── cart/
│   │   │   ├── index.tsx
│   │   │   └── checkout.tsx
│   │   ├── orders/
│   │   │   ├── index.tsx
│   │   │   ├── [id].tsx
│   │   │   └── tracking/[id].tsx
│   │   └── profile/
│   │       ├── index.tsx
│   │       ├── edit.tsx
│   │       ├── addresses.tsx
│   │       ├── change-password.tsx
│   │       └── settings.tsx
│   │
│   └── _layout.tsx (Root Layout)
│
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Header.tsx
│   │   ├── Loading.tsx
│   │   └── EmptyState.tsx
│   │
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductImage.tsx
│   │   └── RatingStars.tsx
│   │
│   ├── cart/
│   │   ├── CartItem.tsx
│   │   ├── CartSummary.tsx
│   │   └── ApplyCoupon.tsx
│   │
│   ├── order/
│   │   ├── OrderCard.tsx
│   │   ├── OrderTimeline.tsx
│   │   └── TrackingMap.tsx
│   │
│   └── form/
│       ├── InputField.tsx
│       ├── PickerField.tsx
│       └── CheckboxField.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useCart.ts
│   ├── useOrders.ts
│   ├── useUser.ts
│   └── useProducts.ts
│
├── context/
│   ├── AuthContext.tsx
│   ├── CartContext.tsx
│   └── AppContext.tsx
│
├── services/
│   ├── api.ts
│   ├── authService.ts
│   ├── productService.ts
│   ├── cartService.ts
│   ├── orderService.ts
│   ├── userService.ts
│   └── paymentService.ts
│
├── types/
│   ├── index.ts
│   ├── auth.ts
│   ├── product.ts
│   ├── cart.ts
│   ├── order.ts
│   └── user.ts
│
├── utils/
│   ├── formatting.ts
│   ├── validation.ts
│   ├── storage.ts
│   └── constants.ts
│
├── styles/
│   ├── colors.ts
│   ├── typography.ts
│   └── spacing.ts
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── scripts/
│   └── reset-project.js
│
├── package.json
├── app.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## V. Các Dependencies Chính (Đã Có Sẵn)

### Navigation & Routing

```json
{
  "expo-router": "~6.0.23",
  "@react-navigation/native": "7.1.33",
  "@react-navigation/bottom-tabs": "7.15.5",
  "react-native-screens": "~4.16.0",
  "react-native-safe-area-context": "~5.6.2"
}
```

### UI & Animations

```json
{
  "react-native-reanimated": "~4.1.1",
  "react-native-gesture-handler": "~2.28.0",
  "expo-glass-effect": "~0.1.9"
}
```

### Utilities

```json
{
  "expo-constants": "~18.0.13",
  "expo-device": "~8.0.10",
  "expo-font": "~14.0.11",
  "expo-image": "~3.0.11"
}
```

### Thêm cần cài đặt:

```bash
npm install axios redux react-redux
npm install --save-dev @redux-devtools/core
npm install react-native-stripe-sdk react-native-paypal
npm install @react-native-async-storage/async-storage
npm install react-native-uuid react-native-geolocation-service
```

---

## VI. Kiến Trúc Ứng Dụng

### 6.1 State Management

```
Redux Store
├── auth (Xác thực)
│   ├── user
│   ├── token
│   └── isAuthenticated
├── cart (Giỏ hàng)
│   ├── items
│   ├── total
│   └── coupon
├── products (Sản phẩm)
│   ├── list
│   ├── filters
│   └── currentProduct
└── orders (Đơn hàng)
    ├── list
    ├── currentOrder
    └── trackingData
```

### 6.2 API Integration Layer

```typescript
// services/api.ts
- Base URL configuration
- Axios instance avec interceptors
- Error handling
- Token refresh logic

// Individual Services
authService → Login, Register, Logout
productService → Get products, filters, search
cartService → Add, remove, update items
orderService → Create, list, track orders
userService → Profile, address, password
paymentService → Process payments
```

### 6.3 Context API (Authentication)

```typescript
AuthContext
├── user: User | null
├── isLoading: boolean
├── error: string | null
└── Methods:
    - login(email, password)
    - register(userData)
    - logout()
    - updateProfile(data)
```

---

## VII. Quy Trình Luồng Chính

### 7.1 Quy Trình Đăng Nhập

```
Login Screen
    ↓
Input Email/Password
    ↓
Submit → authService.login()
    ↓
Save Token → AsyncStorage
    ↓
Update Redux Store
    ↓
Navigate to Home
```

### 7.2 Quy Trình Mua Hàng

```
Browse Products
    ↓
Select Product → View Details
    ↓
Add to Cart
    ↓
Go to Cart → Review Items
    ↓
Apply Coupon (Optional)
    ↓
Checkout
    ├── Select Address
    ├── Select Payment Method
    └── Confirm Order
    ↓
Process Payment
    ↓
Create Order → Backend
    ↓
Show Confirmation
    ↓
Navigate to Orders
```

### 7.3 Quy Trình Theo Dõi Đơn Hàng

```
Orders Screen
    ↓
Select Order
    ↓
View Order Details
    ├── Items
    ├── Status
    ├── Timeline
    └── Tracking Map
    ↓
Can Cancel/Return
```

---

## VIII. Giao Diện Chính (Screen Details)

### 8.1 Home Screen

```
┌─────────────────────────┐
│  Header (Search + Menu) │
├─────────────────────────┤
│  [Promotions Carousel]  │
├─────────────────────────┤
│  [Categories]           │
├─────────────────────────┤
│  [Featured Products]    │
│  ┌──────┐ ┌──────┐     │
│  │Prod  │ │Prod  │     │
│  │ Img  │ │ Img  │     │
│  │Name  │ │Name  │     │
│  │15$   │ │20$   │     │
│  └──────┘ └──────┘     │
└─────────────────────────┘
```

### 8.2 Cart Screen

```
┌──────────────────────────┐
│  Shopping Cart           │
├──────────────────────────┤
│ ☐ [Prod Name]      $15  │
│   Qty: [–] 1 [+]         │
├──────────────────────────┤
│ ☐ [Prod Name]      $20  │
│   Qty: [–] 2 [+]         │
├──────────────────────────┤
│ [Apply Coupon Code]      │
├──────────────────────────┤
│ Subtotal:        $55     │
│ Shipping:        $5      │
│ Discount:       -$5      │
│ Total:          $55      │
├──────────────────────────┤
│  [PROCEED TO CHECKOUT]   │
└──────────────────────────┘
```

### 8.3 Checkout Screen

```
┌──────────────────────────┐
│ SHIPPING ADDRESS         │
├──────────────────────────┤
│ ▼ Select Address         │
│  [+ Add New Address]     │
├──────────────────────────┤
│ PAYMENT METHOD           │
├──────────────────────────┤
│ ◉ Credit Card            │
│ ○ PayPal                 │
│ ○ Bank Transfer          │
├──────────────────────────┤
│ ORDER SUMMARY            │
│ Total: $55               │
├──────────────────────────┤
│  [PLACE ORDER]           │
└──────────────────────────┘
```

### 8.4 Orders List Screen

```
┌──────────────────────────┐
│  My Orders               │
├──────────────────────────┤
│ Order #ORD001            │
│ ━━━━━━━━━━━━━━━━━━━━━━  │
│ 3 items | Total: $55     │
│ Status: 🟡 In Transit    │
│ [Tap to View Details]    │
├──────────────────────────┤
│ Order #ORD002            │
│ ━━━━━━━━━━━━━━━━━━━━━━  │
│ 2 items | Total: $30     │
│ Status: ✅ Delivered     │
│ [Tap to View Details]    │
└──────────────────────────┘
```

### 8.5 Order Detail & Tracking

```
┌──────────────────────────┐
│ Order #ORD001            │
├──────────────────────────┤
│ Status Timeline:         │
│ ✅ Order Confirmed       │
│ ✅ Payment Received      │
│ ⏳ Preparing Items       │
│ ⏳ In Transit            │
│ ○ Delivered              │
├──────────────────────────┤
│ [VIEW TRACKING MAP]      │
├──────────────────────────┤
│ Items:                   │
│ - Product 1 x 2          │
│ - Product 2 x 1          │
├──────────────────────────┤
│ [CANCEL ORDER]           │
│ [REQUEST RETURN]         │
└──────────────────────────┘
```

### 8.6 Profile Screen

```
┌──────────────────────────┐
│        PROFILE           │
├──────────────────────────┤
│  [Avatar]                │
│  John Doe                │
│  john@example.com        │
├──────────────────────────┤
│ ⚙️ Edit Profile          │
│ 📍 Manage Addresses      │
│ ❤️ Favorite Products     │
│ 📦 My Orders             │
│ 🔒 Change Password       │
│ 🔔 Notifications         │
│ ℹ️ About Us              │
│ 📞 Help & Support        │
├──────────────────────────┤
│ [LOGOUT]                 │
└──────────────────────────┘
```

### 8.7 Change Password Screen

```
┌──────────────────────────┐
│  CHANGE PASSWORD         │
├──────────────────────────┤
│ Current Password:        │
│ [••••••••••]             │
├──────────────────────────┤
│ New Password:            │
│ [••••••••••]             │
│ ℹ️ Min 8 chars           │
├──────────────────────────┤
│ Confirm Password:        │
│ [••••••••••]             │
├──────────────────────────┤
│ [UPDATE PASSWORD]        │
└──────────────────────────┘
```

---

## IX. Quy Trình Phát Triển (Development Roadmap)

### Phase 1: Setup & Authentication (Week 1-2)

- [ ] Thiết lập Expo + React Router
- [ ] Configure Redux store
- [ ] Tạo Auth screens (Login, Register, Forgot password)
- [ ] Integrate with Backend API
- [ ] Implement Token storage & Auto-login

### Phase 2: Product & Browsing (Week 2-3)

- [ ] Home screen → Product listing
- [ ] Product detail screen
- [ ] Search & Filter functionality
- [ ] Category navigation
- [ ] Favorites/Wishlist feature

### Phase 3: Shopping Cart (Week 3-4)

- [ ] Cart screen UI
- [ ] Add/Remove/Update items
- [ ] Persistent cart (AsyncStorage)
- [ ] Coupon/Discount integration
- [ ] Cart summary calculations

### Phase 4: Checkout & Payment (Week 4-5)

- [ ] Address selection/Management
- [ ] Payment method selection
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Order confirmation screen

### Phase 5: Orders Management (Week 5-6)

- [ ] Orders list screen
- [ ] Order detail screen
- [ ] Order status tracking
- [ ] Real-time tracking/Map integration
- [ ] Cancel & Return functionality

### Phase 6: User Profile (Week 6-7)

- [ ] Profile screen
- [ ] Edit profile
- [ ] Change password
- [ ] Address management
- [ ] Settings & Preferences

### Phase 7: Polish & Testing (Week 7-8)

- [ ] UI/UX refinements
- [ ] Performance optimization
- [ ] Error handling & Validations
- [ ] Testing (Unit, Integration, E2E)
- [ ] Build for iOS & Android

---

## X. Environment Configuration

### .env.example

```
EXPO_PUBLIC_API_BASE_URL=https://api.example.com
EXPO_PUBLIC_API_VERSION=v1
STRIPE_PUBLIC_KEY=pk_test_xxxxx
PAYPAL_CLIENT_ID=xxxxx
GOOGLE_MAPS_API_KEY=xxxxx
```

---

## XI. Scripts & Commands

```bash
# Start development
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Build Web
npm run web

# Lint code
npm run lint

# Reset project
npm run reset-project
```

---

## XII. Best Practices

### Code Organization

- ✅ Functional components + Hooks
- ✅ Custom hooks cho reusability
- ✅ Separate concerns (components, services, utils)
- ✅ TypeScript for type safety

### Performance

- ✅ Lazy loading images
- ✅ FlatList for long lists
- ✅ Memoization (useMemo, useCallback)
- ✅ Code splitting

### Security

- ✅ Secure token storage
- ✅ HTTPS only APIs
- ✅ Input validation
- ✅ Password encryption

### UI/UX

- ✅ Consistent design system
- ✅ Responsive layouts
- ✅ Loading states
- ✅ Error handling & user feedback
- ✅ Dark mode support (optional)

---

## XIII. Công Nghệ Hỗ Trợ Bổ Sung (Optional)

| Feature            | Library                  |
| ------------------ | ------------------------ |
| State Management   | Redux Toolkit            |
| API Calls          | Axios + RTK Query        |
| Form Management    | React Hook Form          |
| Validation         | Zod / Yup                |
| Analytics          | Firebase Analytics       |
| Push Notifications | Expo Notifications       |
| Maps               | React Native Maps        |
| Date Picker        | React Native Date Picker |
| Bottom Sheet       | Bottom Sheet Modal       |
| Toast/Snackbar     | React Native Toast       |

---

## XIV. Tài Liệu Tham Khảo

- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [React Navigation](https://reactnavigation.org)
- [Redux](https://redux.js.org)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Lần cập nhật cuối:** April 1, 2026  
**Phiên bản:** 1.0.0
