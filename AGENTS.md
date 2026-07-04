# AGCPOS Project Summary

## 1. Project Name

**AGCPOS**

## 2. Business Name

**Ayam Gunting Cheese**

## 3. Project Description

AGCPOS is a simple responsive PWA POS system for a small food stall named Ayam Gunting Cheese. The system helps the owner record customer orders, track all pending orders, complete paid orders, cancel orders, manage menu items, upload menu images, and view simple sales analytics.

The system is designed for **phone and tablet use**. It should be fast, simple, and easy to use during peak hour.

---

## 4. Main Problem

During peak hour, many customers order at the same time. The owner may forget which orders are still pending. AGCPOS solves this by showing all pending orders clearly inside the POS page.

---

## 5. Final System Scope

AGCPOS will include:

1. Owner login
2. POS order entry
3. Multiple items in one order
4. All pending orders display
5. Complete order flow
6. Cancel order flow
7. Menu management
8. Product image upload with crop UI
9. Analytics dashboard
10. Settings page
11. PWA install support
12. Online/offline status banner

AGCPOS will not include:

1. Staff role
2. Offline order support
3. Report page
4. CSV export
5. Receipt printing
6. Expense tracking
7. Inventory tracking
8. Customer loyalty
9. Quick notes

---

## 6. Target Device

The system must be responsive for:

1. Phone
2. Tablet

Desktop support is optional but the layout should not break.

---

## 7. App Type

AGCPOS should be built as a **PWA** using `next-pwa`.

The app should be installable on phone/tablet home screen.

Important: the app is **100% online**. There is no offline order creation.

If internet is offline:

1. Show offline warning banner.
2. Disable submit order.
3. Disable complete order.
4. Disable cancel order.

---

## 8. Tech Stack

### Frontend

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui
* Poppins font

### Backend

* Firebase Auth
* Cloud Firestore
* Firebase Storage

### PWA

* next-pwa

### State Management

* Zustand

### Forms and Validation

* React Hook Form
* Zod
* @hookform/resolvers

### UI Libraries

* lucide-react
* sonner
* next-themes
* vaul, optional for drawer/bottom sheet

### Image Handling

* Firebase Storage
* Next.js Image
* browser-image-compression
* react-easy-crop

### Analytics

* Recharts

### Utilities

* date-fns
* nanoid
* clsx
* tailwind-merge
* class-variance-authority

### Hosting

* Vercel

---

## 9. Suggested Install Command

```bash
npm install firebase zustand react-hook-form zod @hookform/resolvers
npm install next-pwa browser-image-compression react-easy-crop
npm install lucide-react sonner next-themes vaul
npm install recharts date-fns nanoid clsx tailwind-merge class-variance-authority
```

---

## 10. Branding

### Font

Use **Poppins** for the whole interface.

### Theme Colors

The stall theme is:

1. Yellow
2. Black
3. Red

### Suggested Light Theme

* Background: `#FFF8E1`
* Card: `#FFFFFF`
* Primary: `#FACC15`
* Primary Text: `#111111`
* Header: `#111111`
* Accent Red: `#DC2626`
* Success: `#16A34A`
* Warning: `#F97316`
* Border: `#E5E7EB`

### Suggested Dark Theme

* Background: `#111111`
* Card: `#1F1F1F`
* Primary: `#FACC15`
* Primary Text: `#111111`
* Text: `#FFFFFF`
* Accent Red: `#EF4444`
* Success: `#22C55E`
* Warning: `#FB923C`
* Border: `#333333`

### Logo

Logo will be added later.

For now, reserve a square logo placeholder with the text:

```text
AGC
```

Logo ratio:

```text
1:1 square
```

---

## 11. Authentication

Use **Firebase Auth**.

Rules:

1. Only owner login is needed.
2. No staff role.
3. Stay logged in until the owner manually logs out.
4. Email cannot be changed.
5. Change password is allowed.
6. Logout must ask confirmation first.

Account settings should include:

1. Email, read-only
2. Change password
3. Logout with confirmation

Logout confirmation message:

```text
Are you sure you want to logout?
[Cancel] [Logout]
```

---

## 12. Menu Items

The system has 3 main products.

### 12.1 Ayam Lidi

Price:

```text
RM3
```

Options:

1. With Cheese
2. No Cheese

Powder options:

1. Original
2. Spicy
3. No Powder

Important rule:

```text
Cheese does not affect Ayam Lidi price.
```

---

### 12.2 Ayam Gunting

Price:

```text
Without Cheese = RM10
With Cheese = RM12
```

Options:

1. With Cheese
2. No Cheese

Powder options:

1. Original
2. Spicy
3. No Powder

Important rule:

```text
Cheese affects Ayam Gunting price.
```

---

### 12.3 Sosej Cheese

Price:

```text
RM5
```

Cheese option:

```text
No cheese option needed.
```

Powder options:

1. Original
2. Spicy
3. No Powder

---

## 13. Default POS Options

Use these defaults for faster order entry:

```text
Quantity: 1
Arrangement: Normal
Powder Option: Original
Cheese Option: No Cheese, if product supports cheese
Order Status: Pending
Payment Status: Unpaid
Payment Method: null
```

---

## 14. Order Logic

### Order Status

Only use:

1. Pending
2. Completed
3. Cancelled

### Business Rule

```text
Create order = Pending
Complete order = Paid + Completed
Cancel order = Cancelled
Revenue = Completed orders only
Payment method = selected during completion
```

### Important Payment Rule

When the owner marks an order as complete, it means the customer already paid.

So, when clicking **Complete**, the system must ask payment method first:

1. Cash
2. QR DuitNow
3. Bank Transfer

After selecting payment method:

```text
orderStatus = Completed
paymentStatus = Paid
paymentMethod = selected method
completedAt = current date/time
paidAt = current date/time
```

---

## 15. Order ID Format

Use this format:

```text
YYYYMMDD-001-A7K
```

Example:

```text
20260704-001-A7K
```

Display to user:

```text
#001
```

Rules:

1. Daily order number resets every day.
2. No Firestore daily counter is needed because the system will be used on one device only.
3. To generate the next daily number, check today’s latest order, get the highest `dailyOrderNumber`, then add `+1`.
4. Still use random suffix with `nanoid` for safety.

Example:

```text
Latest today: #008
New order: #009
Order ID: 20260704-009-X7P
Display: #009
```

---

## 16. Arrangement Options

Each order can have an arrangement type:

1. Normal
2. Split into 2 sets
3. Combine in 1 set
4. Custom

There should also be an optional manual note field.

Examples:

```text
Split ayam gunting into 2 sets.
```

```text
Combine ayam gunting and sosej cheese in one box.
```

Quick notes are not needed.

---

## 17. POS Page Requirement

The POS page should have 2 main sections:

1. Create Order
2. All Pending Orders

The system must show **all pending orders** on the POS page, not only the last few orders.

### POS Page Example

```text
AGCPOS

Create Order

[Ayam Lidi] [Ayam Gunting] [Sosej Cheese]

Options:
[With Cheese] [No Cheese]
[Original] [Spicy] [No Powder]

Quantity:
[-] 1 [+]

Arrangement:
[Normal] [Split 2 Sets] [Combine 1 Set] [Custom]

Note:
[Optional note]

Cart:
1x Ayam Gunting - No Cheese - Original - RM10

[Submit Order]

--------------------------------

All Pending Orders

#001 | RM12
Ayam Gunting - With Cheese - Spicy
[Complete] [Cancel]

#002 | RM5
Sosej Cheese - No Powder
[Complete] [Cancel]

#003 | RM3
Ayam Lidi - With Cheese - Original
[Complete] [Cancel]
```

---

## 18. Order Completion Flow

When owner taps **Complete**:

1. Open payment method dialog.
2. Ask: “How did customer pay?”
3. Options:

   * Cash
   * QR DuitNow
   * Bank Transfer
4. After selecting payment method, mark order as completed and paid.

Example dialog:

```text
Select Payment Method

How did customer pay?

[Cash]
[QR DuitNow]
[Bank Transfer]

[Cancel]
```

---

## 19. Cancel Order Flow

Orders should not be deleted.

When cancelled:

```text
orderStatus = Cancelled
paymentStatus = Cancelled
cancelledAt = current date/time
```

Before cancelling, ask confirmation:

```text
Cancel Order #005?

This order will be marked as cancelled and will not be counted as revenue.

[No] [Yes, Cancel]
```

Cancelled orders must not count as revenue.

---

## 20. Product Sold Out Toggle

Menu management must support item availability.

If product is sold out:

1. Show it as sold out.
2. Disable it on POS page.
3. Do not allow it to be added to cart.

Example:

```text
[Sosej Cheese - Sold Out]
```

---

## 21. Menu Image Upload

Menu images are stored in Firebase Storage.

Image upload should exist only inside Menu Management.

Requirements:

1. Upload image.
2. Open crop UI.
3. Crop image to 1:1 square.
4. Allow resize option.
5. Compress image.
6. Upload to Firebase Storage.
7. Save image URL and image path in Firestore.
8. Display image using Next.js Image.

### Image Crop

Use:

```text
react-easy-crop
```

Crop ratio must be locked to:

```text
1:1
```

### Resize Options

Allow these resize sizes:

1. 512 x 512
2. 768 x 768
3. 1024 x 1024

Default:

```text
512 x 512
```

### Compression

Use:

```text
browser-image-compression
```

Recommended result:

```text
Max file size: 300KB - 500KB
Format: WebP or JPEG
```

### Firebase Storage Path

Use:

```text
products/{productId}/menu-image.webp
```

Examples:

```text
products/ayam-lidi/menu-image.webp
products/ayam-gunting/menu-image.webp
products/sosej-cheese/menu-image.webp
```

---

## 22. Next.js Image Setup

Use `next/image` for product images.

Configure Firebase Storage remote URL in `next.config.ts`:

```ts
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
```

---

## 23. Firestore Collections

Use these collections:

```text
users
products
orders
settings
```

No need:

```text
dailyCounters
reports
expenses
inventory
staff
syncQueue
```

---

## 24. Firestore Product Type

```ts
type Product = {
  productId: string;
  name: "Ayam Lidi" | "Ayam Gunting" | "Sosej Cheese";

  basePrice: number;
  withCheesePrice?: number | null;

  hasCheeseOption: boolean;
  hasPowderOption: boolean;
  cheeseAffectsPrice: boolean;

  imageUrl?: string | null;
  imagePath?: string | null;
  imageSize?: 512 | 768 | 1024 | null;
  imageUpdatedAt?: Date | null;

  isAvailable: boolean;
  sortOrder: number;

  createdAt: Date;
  updatedAt: Date;
};
```

Default product data:

```json
[
  {
    "productId": "ayam-lidi",
    "name": "Ayam Lidi",
    "basePrice": 3,
    "withCheesePrice": 3,
    "hasCheeseOption": true,
    "hasPowderOption": true,
    "cheeseAffectsPrice": false,
    "imageUrl": null,
    "imagePath": null,
    "imageSize": null,
    "isAvailable": true,
    "sortOrder": 1
  },
  {
    "productId": "ayam-gunting",
    "name": "Ayam Gunting",
    "basePrice": 10,
    "withCheesePrice": 12,
    "hasCheeseOption": true,
    "hasPowderOption": true,
    "cheeseAffectsPrice": true,
    "imageUrl": null,
    "imagePath": null,
    "imageSize": null,
    "isAvailable": true,
    "sortOrder": 2
  },
  {
    "productId": "sosej-cheese",
    "name": "Sosej Cheese",
    "basePrice": 5,
    "withCheesePrice": null,
    "hasCheeseOption": false,
    "hasPowderOption": true,
    "cheeseAffectsPrice": false,
    "imageUrl": null,
    "imagePath": null,
    "imageSize": null,
    "isAvailable": true,
    "sortOrder": 3
  }
]
```

---

## 25. Firestore Order Item Type

```ts
type OrderItem = {
  orderItemId: string;

  productId: string;
  productName: "Ayam Lidi" | "Ayam Gunting" | "Sosej Cheese";

  quantity: number;

  cheeseOption?: "With Cheese" | "No Cheese" | null;
  powderOption: "Original" | "Spicy" | "No Powder";

  unitPrice: number;
  subtotal: number;
};
```

---

## 26. Firestore Order Type

```ts
type Order = {
  orderId: string; // Example: 20260704-001-A7K
  displayOrderNumber: string; // Example: 001
  dailyOrderNumber: number;
  orderDate: string; // YYYY-MM-DD
  orderCode: string; // Example: A7K

  items: OrderItem[];
  totalAmount: number;

  orderStatus: "Pending" | "Completed" | "Cancelled";

  paymentStatus: "Unpaid" | "Paid" | "Cancelled";
  paymentMethod?: "Cash" | "QR DuitNow" | "Bank Transfer" | null;

  arrangementType:
    | "Normal"
    | "Split into 2 sets"
    | "Combine in 1 set"
    | "Custom";

  note?: string;

  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
  paidAt?: Date | null;
};
```

---

## 27. Settings Type

```ts
type Settings = {
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
```

Default settings:

```json
{
  "stallName": "Ayam Gunting Cheese",
  "posName": "AGCPOS",
  "logoText": "AGC",
  "logoUrl": null,
  "logoPath": null,
  "themeMode": "system",
  "accentTheme": "yellow-black-red",
  "buttonSize": "large",
  "enabledPaymentMethods": {
    "cash": true,
    "qrDuitNow": true,
    "bankTransfer": true
  },
  "confirmBeforeLogout": true,
  "confirmBeforeCancel": true,
  "askPaymentMethodBeforeComplete": true,
  "autoClearCartAfterSubmit": true,
  "dailyOrderReset": true
}
```

---

## 28. Analytics Dashboard

There is no report page and no CSV export.

Analytics should be inside dashboard only.

Dashboard should show:

1. Today Revenue
2. Today Orders
3. Pending Orders
4. Completed Orders
5. Cancelled Orders
6. Pending Amount
7. Best-Selling Product
8. Cash Total
9. QR DuitNow Total
10. Bank Transfer Total

### Calculation Rules

```text
Today Revenue = totalAmount of completed orders today
Pending Amount = totalAmount of pending orders today
Cancelled Amount = totalAmount of cancelled orders today
```

Payment breakdown should only count completed orders:

```text
Cash Total = completed orders with paymentMethod = Cash
QR DuitNow Total = completed orders with paymentMethod = QR DuitNow
Bank Transfer Total = completed orders with paymentMethod = Bank Transfer
```

Revenue must not include:

1. Pending orders
2. Cancelled orders

---

## 29. Internet Status

Because AGCPOS is fully online, add an internet status banner.

If online:

```text
Online: Ready to accept orders
```

If offline:

```text
Offline: You are offline. Orders cannot be submitted.
```

When offline, disable:

1. Submit Order
2. Complete Order
3. Cancel Order
4. Menu update
5. Settings update

---

## 30. Routes

Use this route structure:

```text
/app
  /(auth)
    /login

  /(main)
    /dashboard
    /pos
    /orders
    /menu
    /settings
```

No `/reports` route.

---

## 31. Page Details

### `/login`

Purpose:

1. Owner login
2. Redirect logged-in owner to dashboard or POS

### `/dashboard`

Purpose:

1. Show analytics
2. Show today revenue
3. Show order count
4. Show payment breakdown
5. Show best-selling product

### `/pos`

Purpose:

1. Create order
2. Add multiple items to cart
3. Submit order
4. Show all pending orders
5. Complete orders
6. Cancel orders

### `/orders`

Purpose:

1. View order history
2. Filter by All, Pending, Completed, Cancelled, Today

### `/menu`

Purpose:

1. View menu items
2. Edit prices
3. Set available/sold out
4. Upload product image
5. Crop image 1:1
6. Resize image
7. Save image to Firebase Storage

### `/settings`

Purpose:

1. Account settings
2. Appearance settings
3. Stall profile
4. Payment settings
5. Order safety settings

---

## 32. Settings Page Details

### Account

1. Email read-only
2. Change password
3. Logout with confirmation

Email cannot be changed.

### Appearance

1. Light / Dark / System
2. Poppins font
3. Yellow / Black / Red theme
4. Button size

### Stall Profile

1. Stall name: Ayam Gunting Cheese
2. POS name: AGCPOS
3. Square logo placeholder: AGC

### Payment

1. Enable Cash
2. Enable QR DuitNow
3. Enable Bank Transfer

### Order Safety

1. Confirm before cancel
2. Ask payment method before complete
3. Daily order number reset
4. Auto-clear cart after submit

---

## 33. UI Style Requirement

The interface should be:

1. Simple
2. Fast
3. Mobile-first
4. Tablet responsive
5. Big tap buttons
6. Clear pending orders
7. Clear order numbers
8. Clear price display
9. Clear status labels

Avoid complicated dropdowns on POS page. Prefer large buttons.

---

## 34. Main POS Interaction Flow

```text
Owner opens POS page
↓
Select product
↓
Select cheese option if available
↓
Select powder option
↓
Set quantity
↓
Select arrangement
↓
Add optional note if needed
↓
Add item to cart
↓
Add more items if needed
↓
Submit order
↓
Order appears in All Pending Orders
↓
When customer receives food and pays, owner taps Complete
↓
Owner selects payment method
↓
Order becomes Completed and Paid
```

---

## 35. Security Requirements

Firestore and Storage must not be public.

Rules:

1. Not logged in = no access
2. Logged in owner = can read/write system data
3. Storage upload only allowed for authenticated owner
4. Storage read only allowed for authenticated owner

Do not use:

```text
allow read, write: if true;
```

---

## 36. Final Business Logic Summary

```text
AGCPOS is online-only.
Firebase Auth handles login.
Firestore stores products, orders, and settings.
Firebase Storage stores product images.
PWA makes the system installable.
Order starts as Pending and Unpaid.
Completing an order means customer has paid.
Payment method is selected during completion.
Cancelled orders are kept, not deleted.
Revenue only counts completed orders.
All pending orders must be visible on POS page.
Menu images must be square 1:1, cropped, resized, compressed, and displayed using Next.js Image.
```

---

## 37. Final One-Sentence Description

AGCPOS is a responsive online PWA POS system for Ayam Gunting Cheese that helps the owner create orders, view all pending orders, complete paid orders with payment method tracking, manage menu images and availability, and view simple sales analytics.
