"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { EmailAuthProvider, reauthenticateWithCredential, signOut, updatePassword } from "firebase/auth";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import imageCompression from "browser-image-compression";
import { Camera, KeyRound, LogOut, Save } from "lucide-react";
import { toast } from "sonner";
import { auth, db, storage } from "@/lib/firebase";
import { useAppData } from "@/hooks/useFirebaseData";
import { useOnline } from "@/hooks/useOnline";
import { Button, Card, Dialog, Field, PasswordInput, ToggleSwitch, inputClass } from "@/components/ui";
import type { Settings } from "@/lib/types";

export default function SettingsPage() {
  const { user, settings } = useAppData();
  const isOnline = useOnline();
  const { setTheme } = useTheme();
  const [draft, setDraft] = useState<Settings>(settings);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  useEffect(() => {
    window.setTimeout(() => {
      setDraft(settings);
    }, 0);
  }, [settings]);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    };
  }, [logoPreviewUrl]);

  function patch(patchValue: Partial<Settings>) {
    setDraft((current) => ({ ...current, ...patchValue }));
  }

  const hasProfileChanges =
    draft.stallName !== settings.stallName ||
    draft.posName !== settings.posName ||
    Boolean(logoFile) ||
    removeLogo;

  async function saveSettings(patchValue: Partial<Settings>) {
    if (!isOnline) return;
    const nextDraft = { ...draft, ...patchValue };
    setDraft(nextDraft);
    try {
      await updateDoc(doc(db, "settings", "app"), { ...patchValue, updatedAt: serverTimestamp() });
      if (patchValue.themeMode) setTheme(patchValue.themeMode);
      toast.success("Settings updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update settings");
    }
  }

  async function changePassword() {
    if (!user?.email || !currentPassword || !newPassword) return;
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace("Firebase: ", "") : "Unable to change password");
    }
  }

  async function logout() {
    await signOut(auth);
  }

  function selectLogo(file?: File) {
    if (!file) return;
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    setRemoveLogo(false);
    setLogoFile(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
  }

  function markLogoForRemoval() {
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    setLogoFile(null);
    setLogoPreviewUrl(null);
    setRemoveLogo(true);
    patch({ logoUrl: null });
  }

  async function saveStallProfile() {
    if (!isOnline) return;
    if (!draft.stallName.trim() || !draft.posName.trim()) {
      toast.error("Stall name and POS name are required");
      return;
    }
    setSavingProfile(true);
    setUploadingLogo(Boolean(logoFile));
    try {
      let logoUrl = draft.logoUrl ?? null;
      let logoPath = draft.logoPath ?? null;

      if ((logoFile || removeLogo) && draft.logoPath) {
        try {
          await deleteObject(ref(storage, draft.logoPath));
        } catch (error) {
          const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
          if (code !== "storage/object-not-found") throw error;
        }
      }

      if (removeLogo) {
        logoUrl = null;
        logoPath = null;
      }

      if (logoFile) {
        const compressed = await imageCompression(logoFile, {
          maxSizeMB: 0.45,
          maxWidthOrHeight: 512,
          fileType: "image/webp",
        });
        logoPath = "settings/logo/logo.webp";
        const logoRef = ref(storage, logoPath);
        await uploadBytes(logoRef, compressed, { contentType: "image/webp" });
        logoUrl = await getDownloadURL(logoRef);
      }

      await updateDoc(doc(db, "settings", "app"), {
        stallName: draft.stallName,
        posName: draft.posName,
        logoUrl,
        logoPath,
        updatedAt: serverTimestamp(),
      });
      patch({ logoUrl, logoPath });
      setLogoFile(null);
      setLogoPreviewUrl(null);
      setRemoveLogo(false);
      toast.success("Stall profile saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save stall profile");
    } finally {
      setSavingProfile(false);
      setUploadingLogo(false);
    }
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-black">Settings</h1>

      <Card className="grid gap-4">
        <h2 className="text-xl font-black">Account</h2>
        <Field label="Email">
          <input className={inputClass} placeholder="Owner email address" value={user?.email ?? ""} readOnly />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Current Password">
            <PasswordInput
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </Field>
          <Field label="New Password">
            <PasswordInput
              placeholder="Enter new password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </Field>
          <Field label="Confirm Password">
            <PasswordInput
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="light" disabled={!isOnline || !currentPassword || !newPassword || !confirmPassword} onClick={changePassword}>
            <KeyRound size={18} />
            Change Password
          </Button>
          <Button variant="danger" onClick={() => setConfirmLogout(true)}>
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </Card>

      <Card className="grid gap-4">
        <h2 className="text-xl font-black">Stall Profile</h2>
        <div className="grid gap-3 sm:grid-cols-[96px_1fr]">
          <label className="group relative grid aspect-square cursor-pointer place-items-center overflow-hidden rounded-lg bg-[var(--primary)] text-2xl font-black text-black">
            {draft.logoUrl ? (
              <Image src={logoPreviewUrl ?? draft.logoUrl} alt="AGC logo" fill className="object-cover" sizes="96px" />
            ) : logoPreviewUrl ? (
              <Image src={logoPreviewUrl} alt="AGC logo preview" fill className="object-cover" sizes="96px" />
            ) : (
              "AGC"
            )}
            <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/70 text-white shadow-sm">
              <Camera size={15} />
            </span>
            <span className="absolute inset-0 hidden place-items-center bg-black/55 text-white group-hover:grid">
              <Camera size={24} />
            </span>
            <span className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1 text-center text-[10px] font-bold text-white">
              {uploadingLogo ? "Uploading" : "Change logo"}
            </span>
            <input
              className="hidden"
              type="file"
              accept="image/*"
              disabled={!isOnline || savingProfile}
              onChange={(event) => selectLogo(event.target.files?.[0])}
            />
          </label>
          <div className="grid gap-3">
            <Field label="Stall Name">
              <input
                className={inputClass}
                placeholder="Ayam Gunting Cheese"
                value={draft.stallName}
                onChange={(event) => patch({ stallName: event.target.value })}
              />
            </Field>
            <Field label="POS Name">
              <input
                className={inputClass}
                placeholder="AGCPOS"
                value={draft.posName}
                onChange={(event) => patch({ posName: event.target.value })}
              />
            </Field>
          </div>
        </div>
        {draft.logoUrl || logoPreviewUrl || removeLogo ? (
          <Button variant="light" disabled={!isOnline || savingProfile || (!draft.logoUrl && !logoPreviewUrl)} onClick={markLogoForRemoval}>
            Remove Logo
          </Button>
        ) : null}
        <Button disabled={!isOnline || savingProfile || !hasProfileChanges} onClick={saveStallProfile}>
          <Save size={18} />
          {savingProfile ? "Saving..." : "Save Stall Profile"}
        </Button>
      </Card>

      <Card className="grid gap-4">
        <h2 className="text-xl font-black">Appearance</h2>
        <div className="grid grid-cols-3 gap-2">
          {(["light", "dark", "system"] as const).map((mode) => (
            <Button
              key={mode}
              variant={draft.themeMode === mode ? "primary" : "light"}
              disabled={!isOnline || draft.themeMode === mode}
              onClick={() => saveSettings({ themeMode: mode })}
            >
              {mode[0].toUpperCase() + mode.slice(1)}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="grid gap-4">
        <h2 className="text-xl font-black">Payment</h2>
        <Toggle
          label="Cash"
          checked={draft.enabledPaymentMethods.cash}
          disabled={!isOnline}
          onChange={(cash) => saveSettings({ enabledPaymentMethods: { ...draft.enabledPaymentMethods, cash } })}
        />
        <Toggle
          label="QR DuitNow"
          checked={draft.enabledPaymentMethods.qrDuitNow}
          disabled={!isOnline}
          onChange={(qrDuitNow) => saveSettings({ enabledPaymentMethods: { ...draft.enabledPaymentMethods, qrDuitNow } })}
        />
        <Toggle
          label="Bank Transfer"
          checked={draft.enabledPaymentMethods.bankTransfer}
          disabled={!isOnline}
          onChange={(bankTransfer) => saveSettings({ enabledPaymentMethods: { ...draft.enabledPaymentMethods, bankTransfer } })}
        />
      </Card>

      {confirmLogout ? (
        <Dialog title="Are you sure you want to logout?" onClose={() => setConfirmLogout(false)}>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="light" onClick={() => setConfirmLogout(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={logout}>
              Logout
            </Button>
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}

function Toggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-[var(--border)] px-3 font-bold">
      {label}
      <ToggleSwitch label={label} checked={checked} disabled={disabled} onChange={onChange} />
    </label>
  );
}
