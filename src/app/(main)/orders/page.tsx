"use client";

import { useState } from "react";
import { useAppData } from "@/hooks/useFirebaseData";
import { Button, Card, Dialog, EmptyState } from "@/components/ui";
import { rm, todayKey } from "@/lib/utils";
import type { Order, OrderStatus, PaymentMethod } from "@/lib/types";

const statusFilters = ["All", "Today", "Pending", "Completed", "Cancelled"] as const;
const paymentFilters = ["Any", "Cash", "QR DuitNow", "Bank Transfer"] as const;

export default function OrdersPage() {
  const { orders, dataLoading } = useAppData();
  const [filter, setFilter] = useState<(typeof statusFilters)[number]>("Today");
  const [paymentFilter, setPaymentFilter] = useState<(typeof paymentFilters)[number]>("Any");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const shownOrders = orders.filter((order) => {
    const statusMatch =
      filter === "All" ? true : filter === "Today" ? order.orderDate === todayKey() : order.orderStatus === (filter as OrderStatus);
    const paymentMatch = paymentFilter === "Any" ? true : order.paymentMethod === (paymentFilter as PaymentMethod);
    return statusMatch && paymentMatch;
  });

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-black">Orders</h1>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {statusFilters.map((item) => (
          <Button key={item} variant={filter === item ? "primary" : "light"} disabled={filter === item} onClick={() => setFilter(item)}>
            {item}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {paymentFilters.map((item) => (
          <Button
            key={item}
            variant={paymentFilter === item ? "primary" : "light"}
            disabled={paymentFilter === item}
            onClick={() => setPaymentFilter(item)}
          >
            {item}
          </Button>
        ))}
      </div>
      <div className="grid gap-3">
        {shownOrders.map((order) => (
          <Card key={order.orderId} className="cursor-pointer" onClick={() => setSelectedOrder(order)}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-black">#{order.displayOrderNumber}</p>
                <p className="text-xs font-semibold text-[var(--muted)]">{order.orderDate}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black">{rm(order.totalAmount)}</p>
                <p className="text-xs font-bold">
                  {order.orderStatus} / {order.paymentStatus}
                </p>
              </div>
            </div>
            <div className="mt-3 grid gap-1 text-sm font-medium">
              {order.items.map((item) => (
                <p key={item.orderItemId}>
                  {item.quantity}x {item.productName}
                  {item.cheeseOption ? ` - ${item.cheeseOption}` : ""}
                  {item.powderOption !== "No Powder" ? ` - ${item.powderOption}` : ""}
                </p>
              ))}
            </div>
            {order.paymentMethod ? <p className="mt-3 text-xs font-bold text-[var(--muted)]">Paid by {order.paymentMethod}</p> : null}
          </Card>
        ))}
        {!shownOrders.length ? (
          <EmptyState title={dataLoading ? "Loading orders..." : "No orders found"} detail="Try a different status or payment filter." />
        ) : null}
      </div>

      {selectedOrder ? (
        <Dialog title={`Order #${selectedOrder.displayOrderNumber}`} onClose={() => setSelectedOrder(null)}>
          <div className="grid gap-3 text-sm font-semibold">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-yellow-50 p-3 text-black">
              <span>Total</span>
              <span className="text-right font-black">{rm(selectedOrder.totalAmount)}</span>
              <span>Status</span>
              <span className="text-right">{selectedOrder.orderStatus}</span>
              <span>Payment</span>
              <span className="text-right">{selectedOrder.paymentMethod ?? selectedOrder.paymentStatus}</span>
            </div>
            {selectedOrder.items.map((item) => (
              <div key={item.orderItemId} className="rounded-lg border border-[var(--border)] p-3">
                <p className="font-black">
                  {item.quantity}x {item.productName}
                </p>
                <p className="text-[var(--muted)]">
                  {item.cheeseOption ? `${item.cheeseOption} / ` : ""}
                  {item.powderOption}
                </p>
                <p>{rm(item.subtotal)}</p>
              </div>
            ))}
            {selectedOrder.note ? <p className="rounded-lg border border-[var(--border)] p-3">{selectedOrder.note}</p> : null}
            <Button onClick={() => setSelectedOrder(null)}>Close</Button>
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}
