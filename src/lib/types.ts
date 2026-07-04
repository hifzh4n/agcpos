export type ProductName = string;
export type CheeseOption = "With Cheese" | "No Cheese";
export type PowderOption = "Original" | "Spicy" | "No Powder";
export type OrderStatus = "Pending" | "Completed" | "Cancelled";
export type PaymentStatus = "Unpaid" | "Paid" | "Cancelled";
export type PaymentMethod = "Cash" | "QR DuitNow" | "Bank Transfer";
export type ArrangementType =
  | "Normal"
  | "Split into 2 sets"
  | "Combine in 1 set"
  | "Custom";
export type ImageSize = 512 | 768 | 1024;

export type Product = {
  productId: string;
  name: ProductName;
  basePrice: number;
  withCheesePrice?: number | null;
  hasCheeseOption: boolean;
  hasPowderOption: boolean;
  cheeseAffectsPrice: boolean;
  imageUrl?: string | null;
  imagePath?: string | null;
  imageSize?: ImageSize | null;
  imageUpdatedAt?: Date | null;
  isAvailable: boolean;
  isArchived?: boolean;
  archivedAt?: Date | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderItem = {
  orderItemId: string;
  productId: string;
  productName: ProductName;
  quantity: number;
  cheeseOption?: CheeseOption | null;
  powderOption: PowderOption;
  unitPrice: number;
  subtotal: number;
};

export type Order = {
  orderId: string;
  displayOrderNumber: string;
  dailyOrderNumber: number;
  orderDate: string;
  orderCode: string;
  items: OrderItem[];
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod | null;
  arrangementType: ArrangementType;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
  paidAt?: Date | null;
};

export type Settings = {
  stallName: string;
  posName: string;
  logoText: "AGC";
  logoUrl?: string | null;
  logoPath?: string | null;
  themeMode: "light" | "dark" | "system";
  accentTheme: "yellow-black-red";
  buttonSize: "normal" | "large";
  enabledPaymentMethods: {
    cash: boolean;
    qrDuitNow: boolean;
    bankTransfer: boolean;
  };
  confirmBeforeLogout: boolean;
  confirmBeforeCancel: boolean;
  askPaymentMethodBeforeComplete: boolean;
  autoClearCartAfterSubmit: boolean;
  dailyOrderReset: boolean;
  updatedAt: Date;
};
