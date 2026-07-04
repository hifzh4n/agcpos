import { Timestamp } from "firebase/firestore";
import type { Product, Order, CheeseOption } from "@/lib/types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function rm(value: number) {
  return `RM${value.toFixed(value % 1 === 0 ? 0 : 2)}`;
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function compactDateKey(date = new Date()) {
  return todayKey(date).replaceAll("-", "");
}

export function padOrderNumber(value: number) {
  return String(value).padStart(3, "0");
}

export function productPrice(product: Product, cheeseOption?: CheeseOption | null) {
  if (product.cheeseAffectsPrice && cheeseOption === "With Cheese") {
    return product.withCheesePrice ?? product.basePrice;
  }
  return product.basePrice;
}

export function fromFirestoreDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }
  return null;
}

export function normalizeOrder(raw: Record<string, unknown>): Order {
  return {
    ...(raw as Order),
    createdAt: fromFirestoreDate(raw.createdAt) ?? new Date(),
    updatedAt: fromFirestoreDate(raw.updatedAt) ?? new Date(),
    completedAt: fromFirestoreDate(raw.completedAt),
    cancelledAt: fromFirestoreDate(raw.cancelledAt),
    paidAt: fromFirestoreDate(raw.paidAt),
  };
}

export function initialsLogo(text = "AGC") {
  return text.slice(0, 3).toUpperCase();
}
