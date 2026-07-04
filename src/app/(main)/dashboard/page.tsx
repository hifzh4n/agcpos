"use client";

import { useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useAppData } from "@/hooks/useFirebaseData";
import { Card, Field, inputClass } from "@/components/ui";
import { rm, todayKey } from "@/lib/utils";

export default function DashboardPage() {
  const { orders } = useAppData();
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const todaysOrders = orders.filter((order) => order.orderDate === selectedDate);
  const completed = todaysOrders.filter((order) => order.orderStatus === "Completed");
  const pending = todaysOrders.filter((order) => order.orderStatus === "Pending");
  const cancelled = todaysOrders.filter((order) => order.orderStatus === "Cancelled");
  const revenue = completed.reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingAmount = pending.reduce((sum, order) => sum + order.totalAmount, 0);
  const cancelledAmount = cancelled.reduce((sum, order) => sum + order.totalAmount, 0);
  const paymentTotal = (method: string) =>
    completed.filter((order) => order.paymentMethod === method).reduce((sum, order) => sum + order.totalAmount, 0);
  const itemCounts = completed.flatMap((order) => order.items).reduce<Record<string, number>>((acc, item) => {
    acc[item.productName] = (acc[item.productName] ?? 0) + item.quantity;
    return acc;
  }, {});
  const bestSellerEntry = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0];
  const bestSeller = bestSellerEntry?.[0] ?? "No sales yet";
  const chartData = [
    { name: "Cash", value: paymentTotal("Cash"), color: "#16A34A" },
    { name: "QR", value: paymentTotal("QR DuitNow"), color: "#FACC15" },
    { name: "Bank", value: paymentTotal("Bank Transfer"), color: "#DC2626" },
  ].filter((item) => item.value > 0);
  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${String(hour).padStart(2, "0")}:00`,
    sales: completed
      .filter((order) => order.completedAt?.getHours() === hour || order.paidAt?.getHours() === hour)
      .reduce((sum, order) => sum + order.totalAmount, 0),
  })).filter((item) => item.sales > 0);

  const stats = [
    ["Revenue", rm(revenue)],
    ["Orders", String(todaysOrders.length)],
    ["Pending Orders", String(pending.length)],
    ["Completed Orders", String(completed.length)],
    ["Cancelled Orders", String(cancelled.length)],
    ["Pending Amount", rm(pendingAmount)],
    ["Cancelled Amount", rm(cancelledAmount)],
    ["Best-Selling Product", bestSeller],
    ["Cash Total", rm(paymentTotal("Cash"))],
    ["QR DuitNow Total", rm(paymentTotal("QR DuitNow"))],
    ["Bank Transfer Total", rm(paymentTotal("Bank Transfer"))],
  ];

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-black">Dashboard</h1>
        <Field label="Date">
          <input className={inputClass} type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map(([label, value]) => (
          <Card key={label} className="min-h-24">
            <p className="text-xs font-bold text-[var(--muted)]">{label}</p>
            <p className="mt-2 break-words text-xl font-black">{value}</p>
          </Card>
        ))}
      </div>
      <Card>
        <h2 className="mb-3 text-lg font-black">Payment Breakdown</h2>
        <div className="h-56">
          {chartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={82} label>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center text-sm font-semibold text-[var(--muted)]">No completed payments today</div>
          )}
        </div>
      </Card>
      <Card>
        <h2 className="mb-3 text-lg font-black">Sales By Hour</h2>
        <div className="h-56">
          {hourlyData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Bar dataKey="sales" fill="#FACC15" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center text-sm font-semibold text-[var(--muted)]">No hourly sales for this date</div>
          )}
        </div>
      </Card>
    </div>
  );
}
