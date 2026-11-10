/**
 * Order Types — khớp đúng với backend Order.js Model
 */

import { Product } from "./product";

export type PaymentMethod = 'Tiền mặt' | 'Chuyển khoản' | '';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type DeliveryStatus = 'pending' | 'completed' | 'failed';
export type OrderSource = '' | 'app';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';

export interface OrderItem {
  id?: Product; // ObjectId Product, có thể đã populate thành object nếu backend populate "items.id"
  productId: string;
  productName: string;
  specifications?: string;
  unit?: string;
  description?: string;
  quantity: number;
  unitPrice: number; // Giá tại thời điểm đặt hàng — KHÔNG dùng "price" như bản cũ
  priceDate?: string;
  totalPrice: number;
}

export interface Order {
  _id: string;
  orderId: string; // Mã đơn dạng "1-080926" — dùng cái này để hiển thị, KHÔNG có "orderNumber"
  customerCode: string; // KHÔNG có "userId"
  customerName: string;
  customerLevel2Name?: string;
  issuedByCode?: string;
  issuedByName?: string;
  accountId?: string | { _id: string; [key: string]: any }; // populated nếu BE trả kèm
  orderDate: string;
  total: number;
  payable?: number; // Backend KHÔNG có field này — chỉ dùng để hiển thị "Còn phải trả" trong UI
  totalSplit?: number;
  items: OrderItem[];
  notes?: string;
  deliveryDate?: string;
  paymentDate?: string;
  paymentMethod: PaymentMethod;
  orderStatus?: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus; // Backend KHÔNG có field "status" chung — phải suy ra từ 2 field này
  deliveryRequest?: {
    desiredDate?: string;
    desiredTimeSlot?: string;
    hasIce?: boolean;
    hasStyrofoamBox?: boolean;
    note?: string;
    deliveryAddress?: string;
  };
  deliveryConfirmation?: {
    confirmedDate?: string;
    confirmedTimeSlot?: string;
    confirmationNote?: string;
    confirmedByCode?: string;
    confirmedByName?: string;
    confirmedAt?: string;
    status?: 'pending' | 'confirmed' | 'changed' | 'cancelled';
     shippingFee?: number;
    styrofoamBox?: {
      id?: string;
      name?: string;
      quantity: number;
      unitPrice: number;
    }[];
  };
  customerPay?: number;
  refund?: number;
  isSplit: boolean;
  parentOrderId?: string;
  childrenOrderId?: string[];
  company?: string;
  lockCompany?: boolean;
  isVip: boolean;
  source: OrderSource;
  address?: string | null; // Backend tự gắn thêm field này vào response (string, KHÔNG phải object như "shippingAddress" cũ)
}

// Backend trả THẲNG một mảng Order[], KHÔNG bọc { data, pagination }
export type OrdersResponse = Order[];

export interface CreateOrderRequest {
  orderId?: string;
  customerCode: string;
  customerName: string;
  customerLevel2Name?: string;
  accountId?: string;
  items: {
    // Lưu ý: backend tìm sản phẩm bằng Product.findOne({ id: item.productId })
    // — "productId" ở đây phải khớp field "id" (String) của Product, KHÔNG phải Mongo _id
    productId: string;
    quantity: number;
  }[];
  total: number;
  deliveryRequest?: {
    desiredDate?: string;
    desiredTimeSlot?: string;
    hasIce?: boolean;
    hasStyrofoamBox?: boolean;
    note?: string;
    deliveryAddress?: string;
  };
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  deliveryStatus?: DeliveryStatus;
  deliveryDate?: string;
  customerPay?: number;
  refund?: number;
  notes?: string;
  isVip?: boolean;
  issuedByCode?: string;
  issuedByName?: string;
  orderDate?: string;
}