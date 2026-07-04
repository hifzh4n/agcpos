"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { defaultSettings } from "@/lib/defaults";
import { useAuthUser } from "@/hooks/useFirebaseData";
import { FaviconSync } from "@/components/FaviconSync";
import { Button, Card, Field, PasswordInput, inputClass } from "@/components/ui";
import type { Settings } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuthUser();
  const [appSettings, setAppSettings] = useState<Settings>(defaultSettings);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "settings", "app"))
      .then((snapshot) => {
        if (snapshot.exists()) {
          setAppSettings({ ...defaultSettings, ...(snapshot.data() as Settings) });
        }
      })
      .catch(() => {
        setAppSettings(defaultSettings);
      });
  }, []);

  useEffect(() => {
    if (!loading && user) router.replace("/pos");
  }, [loading, router, user]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Logged in");
      router.replace("/pos");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] p-4">
      <FaviconSync logoUrl={appSettings.logoUrl} />
      <Card className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="relative grid size-14 place-items-center overflow-hidden rounded-lg border-2 border-black bg-[var(--primary)] text-lg font-black text-black">
            {appSettings.logoUrl ? (
              <Image src={appSettings.logoUrl} alt="AGC logo" fill className="object-cover" sizes="56px" />
            ) : (
              appSettings.logoText
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black">{appSettings.posName}</h1>
            <p className="text-sm font-medium text-[var(--muted)]">{appSettings.stallName}</p>
          </div>
        </div>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <Field label="Email">
            <input
              className={inputClass}
              type="email"
              placeholder="agc@gmail.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>
          <Field label="Password">
            <PasswordInput
              placeholder="Enter owner password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>
          <Button className="w-full" disabled={submitting}>
            <LogIn size={18} />
            {submitting ? "Logging in..." : "Login"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
