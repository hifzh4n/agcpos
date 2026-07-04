"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { BarChart3, ClipboardList, Menu as MenuIcon, Settings, ShoppingCart } from "lucide-react";
import { useEffect } from "react";
import { useAppData } from "@/hooks/useFirebaseData";
import { useOnline } from "@/hooks/useOnline";
import { FaviconSync } from "@/components/FaviconSync";
import { OnlineBanner } from "@/components/OnlineBanner";
import { cn, initialsLogo } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/pos", label: "POS", icon: ShoppingCart },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/menu", label: "Menu", icon: MenuIcon },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, settings, dataError } = useAppData();
  const isOnline = useOnline();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  useEffect(() => {
    setTheme(settings.themeMode);
  }, [setTheme, settings.themeMode]);

  if (loading || !user) {
    return <div className="grid min-h-screen place-items-center font-bold">Loading AGCPOS...</div>;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 text-[var(--foreground)]">
      <FaviconSync logoUrl={settings.logoUrl} />
      <OnlineBanner isOnline={isOnline} />
      {dataError ? (
        <div className="bg-[var(--danger)] px-3 py-2 text-center text-xs font-bold text-white">
          Firebase error: {dataError}
        </div>
      ) : null}
      <header
        className="sticky top-0 z-20 border-b border-[var(--border)] shadow-sm"
        style={{
          backgroundColor: resolvedTheme === "dark" ? "#1F1F1F" : "#FACC15",
          color: resolvedTheme === "dark" ? "#FFFFFF" : "#111111",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div
            className="relative grid size-12 place-items-center overflow-hidden rounded-lg text-base font-black text-black shadow-sm"
            style={{
              backgroundColor: resolvedTheme === "dark" ? "#FACC15" : "#FFFFFF",
              border: resolvedTheme === "dark" ? "2px solid #FACC15" : "2px solid #111111",
            }}
          >
            {settings.logoUrl ? (
              <Image src={settings.logoUrl} alt="AGC logo" fill className="object-cover" sizes="48px" />
            ) : (
              initialsLogo(settings.logoText)
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-black">{settings.posName}</p>
            <p className="truncate text-xs font-semibold opacity-75">{settings.stallName}</p>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-4">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto grid max-w-3xl grid-cols-5">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold",
                  active ? "bg-[var(--primary)] text-black" : "text-[var(--muted)]",
                )}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
