"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { defaultProducts, defaultSettings } from "@/lib/defaults";
import type { Order, Product, Settings } from "@/lib/types";
import { fromFirestoreDate, normalizeOrder } from "@/lib/utils";

function normalizeProduct(raw: Record<string, unknown>): Product {
  return {
    ...(raw as Product),
    createdAt: fromFirestoreDate(raw.createdAt) ?? new Date(),
    updatedAt: fromFirestoreDate(raw.updatedAt) ?? new Date(),
    imageUpdatedAt: fromFirestoreDate(raw.imageUpdatedAt),
    archivedAt: fromFirestoreDate(raw.archivedAt),
  };
}

function normalizeSettings(raw: Record<string, unknown>): Settings {
  return {
    ...defaultSettings,
    ...(raw as Settings),
    enabledPaymentMethods: {
      ...defaultSettings.enabledPaymentMethods,
      ...((raw.enabledPaymentMethods as Settings["enabledPaymentMethods"]) ?? {}),
    },
    updatedAt: fromFirestoreDate(raw.updatedAt) ?? new Date(),
  };
}

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  return { user, loading };
}

export function useProducts(user: User | null) {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      window.setTimeout(() => {
        setProducts(defaultProducts);
        setLoading(false);
      }, 0);
      return;
    }

    const productsQuery = query(collection(db, "products"), orderBy("sortOrder", "asc"));
    return onSnapshot(
      productsQuery,
      async (snapshot) => {
        setError(null);
        if (snapshot.empty) {
          await Promise.all(
            defaultProducts.map((product) =>
              setDoc(doc(db, "products", product.productId), {
                ...product,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              }),
            ),
          );
          setProducts(defaultProducts);
        } else {
          setProducts(snapshot.docs.map((item) => normalizeProduct(item.data())));
        }
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      },
    );
  }, [user]);

  return { products, loading, error };
}

export function useOrders(user: User | null) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      window.setTimeout(() => {
        setOrders([]);
        setLoading(false);
      }, 0);
      return;
    }

    const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    return onSnapshot(
      ordersQuery,
      (snapshot) => {
        setError(null);
        setOrders(snapshot.docs.map((item) => normalizeOrder(item.data())));
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      },
    );
  }, [user]);

  return { orders, loading, error };
}

export function useSettings(user: User | null) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      window.setTimeout(() => {
        setSettings(defaultSettings);
        setLoading(false);
      }, 0);
      return;
    }

    return onSnapshot(
      doc(db, "settings", "app"),
      async (snapshot) => {
        setError(null);
        if (!snapshot.exists()) {
          await setDoc(doc(db, "settings", "app"), {
            ...defaultSettings,
            updatedAt: serverTimestamp(),
          });
          setSettings(defaultSettings);
        } else {
          setSettings(normalizeSettings(snapshot.data()));
        }
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      },
    );
  }, [user]);

  return { settings, loading, error };
}

export function useAppData() {
  const authState = useAuthUser();
  const productsState = useProducts(authState.user);
  const ordersState = useOrders(authState.user);
  const settingsState = useSettings(authState.user);

  return useMemo(
    () => ({
      ...authState,
      products: productsState.products,
      orders: ordersState.orders,
      settings: settingsState.settings,
      dataLoading: productsState.loading || ordersState.loading || settingsState.loading,
      dataError: productsState.error || ordersState.error || settingsState.error,
    }),
    [authState, productsState, ordersState, settingsState],
  );
}
