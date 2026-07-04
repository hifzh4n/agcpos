"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { nanoid } from "nanoid";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { useAppData } from "@/hooks/useFirebaseData";
import { useOnline } from "@/hooks/useOnline";
import { Button, Card, Dialog, inputClass } from "@/components/ui";
import type { ArrangementType, CheeseOption, Order, OrderItem, PaymentMethod, PowderOption } from "@/lib/types";
import { compactDateKey, padOrderNumber, productPrice, rm, todayKey } from "@/lib/utils";

const powderOptions: PowderOption[] = ["Original", "Spicy", "No Powder"];
const cheeseOptions: CheeseOption[] = ["No Cheese", "With Cheese"];
const arrangements: ArrangementType[] = ["Normal", "Split into 2 sets", "Combine in 1 set", "Custom"];
const paymentMethods: PaymentMethod[] = ["Cash", "QR DuitNow", "Bank Transfer"];

export default function PosPage() {
  const { products, orders, settings } = useAppData();
  const isOnline = useOnline();
  const activeProducts = useMemo(() => products.filter((product) => !product.isArchived), [products]);
  const [selectedProductId, setSelectedProductId] = useState(activeProducts[0]?.productId ?? "ayam-lidi");
  const selectedProduct = activeProducts.find((product) => product.productId === selectedProductId) ?? activeProducts[0];
  const [cheeseOption, setCheeseOption] = useState<CheeseOption>("No Cheese");
  const [powderOption, setPowderOption] = useState<PowderOption>("Original");
  const [quantity, setQuantity] = useState(1);
  const [arrangementType, setArrangementType] = useState<ArrangementType>("Normal");
  const [note, setNote] = useState("");
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [completeOrder, setCompleteOrder] = useState<Order | null>(null);
  const [payOrder, setPayOrder] = useState<Order | null>(null);
  const [cancelOrder, setCancelOrder] = useState<Order | null>(null);
  const [clearCartOpen, setClearCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actioningOrderId, setActioningOrderId] = useState<string | null>(null);
  const pendingOrders = useMemo(
    () => orders.filter((order) => order.orderStatus === "Pending").sort((a, b) => a.dailyOrderNumber - b.dailyOrderNumber),
    [orders],
  );
  const enabledPaymentMethods = paymentMethods.filter((method) => {
    if (method === "Cash") return settings.enabledPaymentMethods.cash;
    if (method === "QR DuitNow") return settings.enabledPaymentMethods.qrDuitNow;
    return settings.enabledPaymentMethods.bankTransfer;
  });

  function addToCart() {
    if (!selectedProduct || !selectedProduct.isAvailable) return;
    const itemCheese = selectedProduct.hasCheeseOption ? cheeseOption : null;
    const unitPrice = productPrice(selectedProduct, itemCheese);
    setCart((items) => {
      const existing = items.find(
        (item) =>
          item.productId === selectedProduct.productId &&
          item.cheeseOption === itemCheese &&
          item.powderOption === (selectedProduct.hasPowderOption ? powderOption : "No Powder") &&
          item.unitPrice === unitPrice,
      );

      if (existing) {
        return items.map((item) =>
          item.orderItemId === existing.orderItemId
            ? {
                ...item,
                quantity: item.quantity + quantity,
                subtotal: (item.quantity + quantity) * item.unitPrice,
              }
            : item,
        );
      }

      return [
        ...items,
        {
        orderItemId: nanoid(8),
        productId: selectedProduct.productId,
        productName: selectedProduct.name,
        quantity,
        cheeseOption: itemCheese,
        powderOption: selectedProduct.hasPowderOption ? powderOption : "No Powder",
        unitPrice,
        subtotal: unitPrice * quantity,
      },
      ];
    });
    setQuantity(1);
    setPowderOption("Original");
    setCheeseOption("No Cheese");
  }

  function nextOrderNumber() {
    const date = todayKey();
    const latest = orders
      .filter((order) => order.orderDate === date)
      .reduce((highest, order) => Math.max(highest, order.dailyOrderNumber), 0);
    return latest + 1;
  }

  async function submitOrder() {
    if (!cart.length || !isOnline) return;
    setSubmitting(true);
    try {
      const dailyOrderNumber = nextOrderNumber();
      const displayOrderNumber = padOrderNumber(dailyOrderNumber);
      const orderCode = nanoid(3).toUpperCase();
      const orderDate = todayKey();
      const orderId = `${compactDateKey()}-${displayOrderNumber}-${orderCode}`;
      await setDoc(doc(db, "orders", orderId), {
        orderId,
        displayOrderNumber,
        dailyOrderNumber,
        orderDate,
        orderCode,
        items: cart,
        totalAmount: cart.reduce((sum, item) => sum + item.subtotal, 0),
        orderStatus: "Pending",
        paymentStatus: "Unpaid",
        paymentMethod: null,
        arrangementType,
        note: note.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        completedAt: null,
        cancelledAt: null,
        paidAt: null,
      });
      setCart([]);
      setArrangementType("Normal");
      setNote("");
      toast.success(`Order #${displayOrderNumber} submitted`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit order");
    } finally {
      setSubmitting(false);
    }
  }

  async function markCompleted(method?: PaymentMethod) {
    if (!completeOrder || !isOnline) return;
    const paymentMethod = method ?? completeOrder.paymentMethod;
    if (!paymentMethod) return;
    setActioningOrderId(completeOrder.orderId);
    try {
      await updateDoc(doc(db, "orders", completeOrder.orderId), {
        orderStatus: "Completed",
        paymentStatus: "Paid",
        paymentMethod,
        completedAt: serverTimestamp(),
        paidAt: completeOrder.paidAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success(`#${completeOrder.displayOrderNumber} completed`);
      setCompleteOrder(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to complete order");
    } finally {
      setActioningOrderId(null);
    }
  }

  async function markPaid(method: PaymentMethod) {
    if (!payOrder || !isOnline) return;
    setActioningOrderId(payOrder.orderId);
    try {
      await updateDoc(doc(db, "orders", payOrder.orderId), {
        paymentStatus: "Paid",
        paymentMethod: method,
        paidAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success(`#${payOrder.displayOrderNumber} marked paid`);
      setPayOrder(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to mark order paid");
    } finally {
      setActioningOrderId(null);
    }
  }

  function onComplete(order: Order) {
    if (order.paymentStatus === "Paid" && order.paymentMethod) {
      setCompleteOrder(order);
      return;
    }
    setCompleteOrder(order);
  }

  async function markCancelled() {
    if (!cancelOrder || !isOnline) return;
    setActioningOrderId(cancelOrder.orderId);
    try {
      await updateDoc(doc(db, "orders", cancelOrder.orderId), {
        orderStatus: "Cancelled",
        paymentStatus: "Cancelled",
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success(`#${cancelOrder.displayOrderNumber} cancelled`);
      setCancelOrder(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to cancel order");
    } finally {
      setActioningOrderId(null);
    }
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <section className="grid gap-4">
        <h1 className="text-2xl font-black">Create Order</h1>
        <Card className="grid gap-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {activeProducts.map((product) => (
              <Button
                key={product.productId}
                className="min-h-20 justify-start text-left"
                variant={selectedProductId === product.productId ? "primary" : "light"}
                disabled={!product.isAvailable}
                onClick={() => setSelectedProductId(product.productId)}
              >
                <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-black/10">
                  {product.imageUrl ? (
                    <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="48px" />
                  ) : null}
                </span>
                <span>
                  {product.name}
                  {!product.isAvailable ? " - Sold Out" : ""}
                </span>
              </Button>
            ))}
          </div>

          {selectedProduct?.hasCheeseOption ? (
            <OptionGrid label="Cheese" values={cheeseOptions} value={cheeseOption} onChange={setCheeseOption} />
          ) : null}
          {selectedProduct?.hasPowderOption ? (
            <OptionGrid label="Powder" values={powderOptions} value={powderOption} onChange={setPowderOption} />
          ) : null}

          <div>
            <p className="mb-2 text-sm font-black">Quantity</p>
            <div className="grid grid-cols-[64px_1fr_64px] overflow-hidden rounded-lg border border-[var(--border)]">
              <Button variant="light" className="rounded-none border-0" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
                <Minus size={18} />
              </Button>
              <div className="grid place-items-center text-xl font-black">{quantity}</div>
              <Button variant="light" className="rounded-none border-0" onClick={() => setQuantity((value) => value + 1)}>
                <Plus size={18} />
              </Button>
            </div>
          </div>

          <OptionGrid label="Arrangement" values={arrangements} value={arrangementType} onChange={setArrangementType} />
          <textarea
            className={inputClass}
            rows={3}
            placeholder="Example: Split ayam gunting into 2 sets"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <Button onClick={addToCart} disabled={!selectedProduct?.isAvailable}>
            <ShoppingBag size={18} />
            Add Item
          </Button>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black">Cart</h2>
            <p className="text-xl font-black">{rm(cartTotal)}</p>
          </div>
          <div className="grid gap-2">
            {cart.map((item) => (
              <div key={item.orderItemId} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] p-3">
                <p className="text-sm font-semibold">
                  {item.quantity}x {item.productName}
                  {item.cheeseOption ? ` - ${item.cheeseOption}` : ""}
                  {item.powderOption !== "No Powder" ? ` - ${item.powderOption}` : ""} - {rm(item.subtotal)}
                </p>
                <Button variant="ghost" className="size-11 p-0" onClick={() => setCart((items) => items.filter((cartItem) => cartItem.orderItemId !== item.orderItemId))}>
                  <Trash2 size={18} />
                </Button>
              </div>
            ))}
            {!cart.length ? <p className="py-4 text-center text-sm font-bold text-[var(--muted)]">No items yet</p> : null}
          </div>
          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            <Button disabled={!cart.length || !isOnline || submitting} onClick={submitOrder}>
              {submitting ? "Submitting..." : "Submit Order"}
            </Button>
            <Button variant="light" className="px-4" disabled={!cart.length} onClick={() => setClearCartOpen(true)}>
              <Trash2 size={18} />
            </Button>
          </div>
        </Card>
      </section>

      <section className="grid content-start gap-4">
        <h2 className="text-2xl font-black">All Pending Orders</h2>
        {pendingOrders.map((order) => (
          <Card key={order.orderId} className="border-l-4 border-l-[var(--primary)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-2xl font-black">#{order.displayOrderNumber}</p>
                <p className="text-xs font-bold text-[var(--muted)]">{order.arrangementType}</p>
                {order.paymentStatus === "Paid" ? (
                  <p className="mt-1 inline-flex rounded-full bg-[var(--success)] px-2 py-1 text-xs font-black text-white">
                    Paid{order.paymentMethod ? ` - ${order.paymentMethod}` : ""}
                  </p>
                ) : null}
              </div>
              <p className="text-2xl font-black">{rm(order.totalAmount)}</p>
            </div>
            <div className="my-3 grid gap-1 text-sm font-semibold">
              {order.items.map((item) => (
                <p key={item.orderItemId}>
                  {item.quantity}x {item.productName}
                  {item.cheeseOption ? ` - ${item.cheeseOption}` : ""}
                  {item.powderOption !== "No Powder" ? ` - ${item.powderOption}` : ""}
                </p>
              ))}
            </div>
            {order.note ? <p className="mb-3 rounded-lg bg-yellow-50 p-2 text-sm font-semibold text-black">{order.note}</p> : null}
            <div className="grid grid-cols-3 gap-2">
              <Button variant="light" disabled={!isOnline || actioningOrderId === order.orderId || order.paymentStatus === "Paid" || !enabledPaymentMethods.length} onClick={() => setPayOrder(order)}>
                {order.paymentStatus === "Paid" ? "Paid" : "Pay"}
              </Button>
              <Button variant="success" disabled={!isOnline || actioningOrderId === order.orderId || (!enabledPaymentMethods.length && order.paymentStatus !== "Paid")} onClick={() => onComplete(order)}>
                {actioningOrderId === order.orderId ? "Working..." : "Complete"}
              </Button>
              <Button variant="danger" disabled={!isOnline || actioningOrderId === order.orderId} onClick={() => setCancelOrder(order)}>
                {actioningOrderId === order.orderId ? "Working..." : "Cancel"}
              </Button>
            </div>
          </Card>
        ))}
        {!pendingOrders.length ? <Card className="text-center font-bold text-[var(--muted)]">No pending orders</Card> : null}
      </section>

      {completeOrder ? (
        <Dialog title="Select Payment Method" onClose={() => setCompleteOrder(null)}>
          <p className="mb-4 text-sm font-semibold text-[var(--muted)]">
            {completeOrder.paymentStatus === "Paid"
              ? `Already paid by ${completeOrder.paymentMethod}. Complete this order?`
              : "How did customer pay?"}
          </p>
          <div className="grid gap-2">
            {completeOrder.paymentStatus === "Paid" && completeOrder.paymentMethod ? (
              <Button disabled={Boolean(actioningOrderId)} onClick={() => markCompleted()}>
                Complete Order
              </Button>
            ) : enabledPaymentMethods.length ? (
              enabledPaymentMethods.map((method) => (
                <Button key={method} disabled={Boolean(actioningOrderId)} onClick={() => markCompleted(method)}>
                  {method}
                </Button>
              ))
            ) : (
              <p className="rounded-lg bg-yellow-50 p-3 text-sm font-bold text-black">Enable at least one payment method in Settings.</p>
            )}
            <Button variant="light" onClick={() => setCompleteOrder(null)}>
              Cancel
            </Button>
          </div>
        </Dialog>
      ) : null}

      {payOrder ? (
        <Dialog title={`Mark Order #${payOrder.displayOrderNumber} Paid`} onClose={() => setPayOrder(null)}>
          <p className="mb-4 text-sm font-semibold text-[var(--muted)]">How did customer pay?</p>
          <div className="grid gap-2">
            {enabledPaymentMethods.map((method) => (
              <Button key={method} disabled={Boolean(actioningOrderId)} onClick={() => markPaid(method)}>
                {method}
              </Button>
            ))}
            <Button variant="light" onClick={() => setPayOrder(null)}>
              Cancel
            </Button>
          </div>
        </Dialog>
      ) : null}

      {cancelOrder ? (
        <Dialog title={`Cancel Order #${cancelOrder.displayOrderNumber}?`} onClose={() => setCancelOrder(null)}>
          <p className="mb-4 text-sm font-semibold text-[var(--muted)]">
            This order will be marked as cancelled and will not be counted as revenue.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="light" onClick={() => setCancelOrder(null)}>
              No
            </Button>
            <Button variant="danger" onClick={markCancelled}>
              {actioningOrderId ? "Cancelling..." : "Yes, Cancel"}
            </Button>
          </div>
        </Dialog>
      ) : null}

      {clearCartOpen ? (
        <Dialog title="Clear Cart?" onClose={() => setClearCartOpen(false)}>
          <p className="mb-4 text-sm font-semibold text-[var(--muted)]">All items in the current cart will be removed.</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="light" onClick={() => setClearCartOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setCart([]);
                setClearCartOpen(false);
              }}
            >
              Clear
            </Button>
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}

function OptionGrid<T extends string>({
  label,
  values,
  value,
  onChange,
}: {
  label: string;
  values: T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-black">{label}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {values.map((item) => (
          <Button key={item} variant={value === item ? "primary" : "light"} onClick={() => onChange(item)}>
            {item}
          </Button>
        ))}
      </div>
    </div>
  );
}
