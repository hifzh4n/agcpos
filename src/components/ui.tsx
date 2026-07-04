import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "dark" | "light" | "danger" | "success" | "ghost";
}) {
  return (
    <button
      className={cn(
        "tap inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition active:scale-[0.99]",
        variant === "primary" && "bg-[var(--primary)] text-black shadow-sm",
        variant === "dark" && "bg-black text-white dark:bg-white dark:text-black",
        variant === "light" && "border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]",
        variant === "danger" && "bg-[var(--danger)] text-white",
        variant === "success" && "bg-[var(--success)] text-white",
        variant === "ghost" && "bg-transparent text-[var(--foreground)]",
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm", className)}
      {...props}
    />
  );
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <Card className="grid place-items-center gap-1 py-8 text-center">
      <p className="font-black text-[var(--foreground)]">{title}</p>
      {detail ? <p className="max-w-sm text-sm font-semibold text-[var(--muted)]">{detail}</p> : null}
    </Card>
  );
}

export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <Card className="w-full max-w-sm" onClick={(event) => event.stopPropagation()}>
        <h2 className="mb-2 text-xl font-black">{title}</h2>
        {children}
      </Card>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function PasswordInput({
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input className={cn(inputClass, "pr-12", className)} type={visible ? "text" : "password"} {...props} />
      <button
        type="button"
        className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-[var(--muted)]"
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((value) => !value)}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-transparent p-1 transition",
        checked ? "bg-[var(--success)]" : "bg-zinc-300 dark:bg-zinc-700",
      )}
    >
      <span
        className={cn(
          "size-6 rounded-full bg-white shadow-sm transition",
          checked ? "translate-x-6" : "translate-x-0",
        )}
      />
    </button>
  );
}

export const inputClass =
  "tap w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-3 text-sm outline-none focus:border-black dark:focus:border-white";
