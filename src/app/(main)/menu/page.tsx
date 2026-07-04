"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import imageCompression from "browser-image-compression";
import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Archive, ArrowDown, ArrowUp, Camera, Plus, RotateCcw, Save } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { db, storage } from "@/lib/firebase";
import { useAppData } from "@/hooks/useFirebaseData";
import { useOnline } from "@/hooks/useOnline";
import { Button, Card, Dialog, Field, ToggleSwitch, inputClass } from "@/components/ui";
import type { ImageSize, Product } from "@/lib/types";
import { rm } from "@/lib/utils";

const sizes: ImageSize[] = [512, 768, 1024];

type ImageDraft = {
  blob: Blob;
  previewUrl: string;
  size: ImageSize;
};

export default function MenuPage() {
  const { products } = useAppData();
  const isOnline = useOnline();
  const [drafts, setDrafts] = useState<Record<string, Partial<Product>>>({});
  const [imageDrafts, setImageDrafts] = useState<Record<string, ImageDraft>>({});
  const [removeImageIds, setRemoveImageIds] = useState<Record<string, boolean>>({});
  const [cropProduct, setCropProduct] = useState<Product | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageSize, setImageSize] = useState<ImageSize>(512);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<"active" | "archived">("active");

  const viewProducts = useMemo(
    () =>
      products
        .filter((product) => (viewMode === "archived" ? product.isArchived : !product.isArchived))
        .map((product) => ({ ...product, ...drafts[product.productId] })),
    [drafts, products, viewMode],
  );
  const activeProducts = products.filter((product) => !product.isArchived);

  function updateDraft(productId: string, patch: Partial<Product>) {
    setDrafts((current) => ({ ...current, [productId]: { ...current[productId], ...patch } }));
  }

  function hasProductChanges(product: Product) {
    const draft = drafts[product.productId] ?? {};
    const hasCheeseOption = Boolean(draft.hasCheeseOption ?? product.hasCheeseOption);
    const cheeseAffectsPrice = hasCheeseOption ? Boolean(draft.cheeseAffectsPrice ?? product.cheeseAffectsPrice) : false;

    return (
      Boolean(imageDrafts[product.productId]) ||
      Boolean(removeImageIds[product.productId]) ||
      (draft.name !== undefined && String(draft.name).trim() !== product.name) ||
      (draft.basePrice !== undefined && Number(draft.basePrice) !== product.basePrice) ||
      (draft.sortOrder !== undefined && Number(draft.sortOrder) !== product.sortOrder) ||
      (draft.withCheesePrice !== undefined && Number(draft.withCheesePrice) !== Number(product.withCheesePrice ?? product.basePrice)) ||
      (draft.hasCheeseOption !== undefined && Boolean(draft.hasCheeseOption) !== product.hasCheeseOption) ||
      (draft.hasPowderOption !== undefined && Boolean(draft.hasPowderOption) !== product.hasPowderOption) ||
      (draft.cheeseAffectsPrice !== undefined && cheeseAffectsPrice !== product.cheeseAffectsPrice) ||
      (draft.isAvailable !== undefined && Boolean(draft.isAvailable) !== product.isAvailable)
    );
  }

  async function addProduct() {
    if (!isOnline) return;
    const productId = `menu-${nanoid(6).toLowerCase()}`;
    const now = serverTimestamp();
    await setDoc(doc(db, "products", productId), {
      productId,
      name: "New Menu Item",
      basePrice: 0,
      withCheesePrice: null,
      hasCheeseOption: false,
      hasPowderOption: true,
      cheeseAffectsPrice: false,
      imageUrl: null,
      imagePath: null,
      imageSize: null,
      isAvailable: true,
      isArchived: false,
      archivedAt: null,
      sortOrder: products.length + 1,
      createdAt: now,
      updatedAt: now,
    });
    toast.success("New menu item added");
  }

  async function saveProduct(product: Product) {
    if (!isOnline) return;
    setSavingId(product.productId);
    try {
      const draft = drafts[product.productId] ?? {};
      const imageDraft = imageDrafts[product.productId];
      let imageUrl = product.imageUrl ?? null;
      let imagePath = product.imagePath ?? null;
      let savedImageSize = product.imageSize ?? null;
      const nextName = String(draft.name ?? product.name).trim();
      const nextBasePrice = Number(draft.basePrice ?? product.basePrice);
      const nextSortOrder = Number(draft.sortOrder ?? product.sortOrder);

      if (!nextName) {
        toast.error("Menu name is required");
        return;
      }

      if (nextBasePrice < 0 || nextSortOrder < 1) {
        toast.error("Price and sort order must be valid numbers");
        return;
      }

      if ((imageDraft || removeImageIds[product.productId]) && product.imagePath) {
        try {
          await deleteObject(ref(storage, product.imagePath));
        } catch (error) {
          const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
          if (code !== "storage/object-not-found") throw error;
        }
      }

      if (removeImageIds[product.productId]) {
        imageUrl = null;
        imagePath = null;
        savedImageSize = null;
      }

      if (imageDraft) {
        imagePath = `products/${product.productId}/menu-image.webp`;
        const imageRef = ref(storage, imagePath);
        const compressed = await imageCompression(new File([imageDraft.blob], "menu-image.webp", { type: "image/webp" }), {
          maxSizeMB: 0.45,
          maxWidthOrHeight: imageDraft.size,
          fileType: "image/webp",
        });
        await uploadBytes(imageRef, compressed, { contentType: "image/webp" });
        imageUrl = await getDownloadURL(imageRef);
        savedImageSize = imageDraft.size;
      }

      const hasCheeseOption = Boolean(draft.hasCheeseOption ?? product.hasCheeseOption);
      const cheeseAffectsPrice = hasCheeseOption ? Boolean(draft.cheeseAffectsPrice ?? product.cheeseAffectsPrice) : false;

      await updateDoc(doc(db, "products", product.productId), {
        name: nextName,
        basePrice: nextBasePrice,
        withCheesePrice: hasCheeseOption ? Number(draft.withCheesePrice ?? product.withCheesePrice ?? product.basePrice) : null,
        hasCheeseOption,
        hasPowderOption: Boolean(draft.hasPowderOption ?? product.hasPowderOption),
        cheeseAffectsPrice,
        isAvailable: Boolean(draft.isAvailable ?? product.isAvailable),
        imageUrl,
        imagePath,
        imageSize: savedImageSize,
        imageUpdatedAt: imageDraft || removeImageIds[product.productId] ? serverTimestamp() : product.imageUpdatedAt ?? null,
        sortOrder: nextSortOrder,
        updatedAt: serverTimestamp(),
      });

      if (imageDraft) URL.revokeObjectURL(imageDraft.previewUrl);
      setImageDrafts((current) => {
        const next = { ...current };
        delete next[product.productId];
        return next;
      });
      setDrafts((current) => {
        const next = { ...current };
        delete next[product.productId];
        return next;
      });
      setRemoveImageIds((current) => {
        const next = { ...current };
        delete next[product.productId];
        return next;
      });
      toast.success(`${product.name} saved`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save menu item");
    } finally {
      setSavingId(null);
    }
  }

  async function archiveProduct(product: Product) {
    if (!isOnline) return;
    try {
      if (!product.isArchived && activeProducts.filter((item) => item.isAvailable).length <= 1 && product.isAvailable) {
        toast.error("Keep at least one available menu item active");
        return;
      }
      await updateDoc(doc(db, "products", product.productId), {
        isArchived: !product.isArchived,
        isAvailable: product.isArchived ? product.isAvailable : false,
        archivedAt: product.isArchived ? null : serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setArchiveTarget(null);
      toast.success(product.isArchived ? `${product.name} restored` : `${product.name} archived`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update menu item");
    }
  }

  function discardChanges(productId: string) {
    const imageDraft = imageDrafts[productId];
    if (imageDraft) URL.revokeObjectURL(imageDraft.previewUrl);
    setDrafts((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
    setImageDrafts((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
    setRemoveImageIds((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  }

  function moveSort(product: Product, direction: -1 | 1) {
    updateDraft(product.productId, { sortOrder: Math.max(1, product.sortOrder + direction) });
  }

  function onImageChange(product: Product, file?: File) {
    if (!file) return;
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setCropProduct(product);
    setImageSrc(URL.createObjectURL(file));
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setCroppedAreaPixels(null);
    setRemoveImageIds((current) => ({ ...current, [product.productId]: false }));
  }

  function markImageForRemoval(productId: string) {
    const imageDraft = imageDrafts[productId];
    if (imageDraft) URL.revokeObjectURL(imageDraft.previewUrl);
    setImageDrafts((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
    setRemoveImageIds((current) => ({ ...current, [productId]: true }));
  }

  async function useCroppedImage() {
    if (!cropProduct || !imageSrc || !croppedAreaPixels) return;
    try {
      const blob = await cropImage(imageSrc, croppedAreaPixels, imageSize);
      const previewUrl = URL.createObjectURL(blob);
      setImageDrafts((current) => {
        const previous = current[cropProduct.productId];
        if (previous) URL.revokeObjectURL(previous.previewUrl);
        return { ...current, [cropProduct.productId]: { blob, previewUrl, size: imageSize } };
      });
      URL.revokeObjectURL(imageSrc);
      setCropProduct(null);
      setImageSrc(null);
      toast.success("Image ready. Click Save to upload.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to crop image");
    }
  }

  function closeCropper() {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setCropProduct(null);
    setImageSrc(null);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Menu Management</h1>
        <Button disabled={!isOnline} onClick={addProduct}>
          <Plus size={18} />
          Add Menu
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant={viewMode === "active" ? "primary" : "light"} disabled={viewMode === "active"} onClick={() => setViewMode("active")}>
          Active
        </Button>
        <Button variant={viewMode === "archived" ? "primary" : "light"} disabled={viewMode === "archived"} onClick={() => setViewMode("archived")}>
          Archived
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {viewProducts.map((product) => {
          const originalProduct = products.find((item) => item.productId === product.productId) ?? (product as Product);
          const imageDraft = imageDrafts[product.productId];
          const imageUrl = removeImageIds[product.productId] ? null : imageDraft?.previewUrl ?? product.imageUrl;
          const hasChanges = hasProductChanges(originalProduct);

          return (
            <Card key={product.productId} className="grid gap-4">
              <label className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-black">
                {imageUrl ? (
                  <Image src={imageUrl} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized={Boolean(imageDraft)} />
                ) : (
                  <div className="grid h-full place-items-center bg-[var(--primary)] text-black">
                    <Camera size={54} />
                  </div>
                )}
                <span className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/70 text-white">
                  <Camera size={16} />
                </span>
                <span className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-2 text-center text-xs font-black text-white">
                  {removeImageIds[product.productId] ? "Image will be removed" : imageDraft ? "New image ready" : "Change image"}
                </span>
                {!product.isAvailable ? (
                  <span className="absolute left-2 top-2 rounded-full bg-[var(--danger)] px-2 py-1 text-xs font-black text-white">Sold Out</span>
                ) : null}
                {product.isArchived ? (
                  <span className="absolute left-2 top-11 rounded-full bg-black px-2 py-1 text-xs font-black text-white">Archived</span>
                ) : null}
                <input className="hidden" type="file" accept="image/*" disabled={!isOnline} onChange={(event) => onImageChange(product as Product, event.target.files?.[0])} />
              </label>
              {hasChanges ? <p className="rounded-lg bg-yellow-50 px-3 py-2 text-xs font-black text-black">Unsaved changes</p> : null}

              <Field label="Menu Name">
                <input
                  className={inputClass}
                  placeholder="Example: Ayam Gunting"
                  value={product.name}
                  onChange={(event) => updateDraft(product.productId, { name: event.target.value })}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Base Price">
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    placeholder="10"
                    value={product.basePrice}
                    onChange={(event) => updateDraft(product.productId, { basePrice: Number(event.target.value) })}
                  />
                </Field>
                <Field label="Sort">
                  <div className="grid grid-cols-[48px_1fr_48px] overflow-hidden rounded-lg border border-[var(--border)]">
                    <Button variant="light" className="rounded-none border-0 p-0" onClick={() => moveSort(product as Product, -1)}>
                      <ArrowUp size={17} />
                    </Button>
                    <input
                      className="w-full bg-[var(--card)] px-2 text-center text-sm font-bold outline-none"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={product.sortOrder}
                      onChange={(event) => updateDraft(product.productId, { sortOrder: Number(event.target.value) })}
                    />
                    <Button variant="light" className="rounded-none border-0 p-0" onClick={() => moveSort(product as Product, 1)}>
                      <ArrowDown size={17} />
                    </Button>
                  </div>
                </Field>
              </div>

              {product.hasCheeseOption ? (
                <Field label="With Cheese Price">
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    placeholder="12"
                    value={product.withCheesePrice ?? product.basePrice}
                    onChange={(event) => updateDraft(product.productId, { withCheesePrice: Number(event.target.value) })}
                  />
                </Field>
              ) : null}

              <div className="grid gap-2">
                <MenuToggle label="Available" checked={product.isAvailable} onChange={(isAvailable) => updateDraft(product.productId, { isAvailable })} />
                <MenuToggle
                  label="Has cheese option"
                  checked={product.hasCheeseOption}
                  onChange={(hasCheeseOption) => updateDraft(product.productId, { hasCheeseOption, cheeseAffectsPrice: hasCheeseOption ? product.cheeseAffectsPrice : false })}
                />
                {product.hasCheeseOption ? (
                  <MenuToggle
                    label="Cheese affects price"
                    checked={product.cheeseAffectsPrice}
                    onChange={(cheeseAffectsPrice) => updateDraft(product.productId, { cheeseAffectsPrice })}
                  />
                ) : null}
                <MenuToggle
                  label="Has powder option"
                  checked={product.hasPowderOption}
                  onChange={(hasPowderOption) => updateDraft(product.productId, { hasPowderOption })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg bg-yellow-50 px-3 py-2 text-sm font-black text-black">
                <span>Display price</span>
                <span>
                  {rm(Number(product.basePrice))}
                  {product.cheeseAffectsPrice ? ` / ${rm(Number(product.withCheesePrice ?? product.basePrice))}` : ""}
                </span>
              </div>

              <div className="grid gap-2">
                <Button
                  variant="light"
                  disabled={!isOnline || (!product.imageUrl && !imageDraft)}
                  onClick={() => markImageForRemoval(product.productId)}
                >
                  Remove Image
                </Button>
              </div>

              <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                <Button disabled={!isOnline || savingId === product.productId || !hasChanges} onClick={() => saveProduct(originalProduct)}>
                  <Save size={18} />
                  {savingId === product.productId ? "Saving..." : "Save"}
                </Button>
                <Button variant="light" className="px-4" disabled={!hasChanges} onClick={() => discardChanges(product.productId)}>
                  <RotateCcw size={18} />
                </Button>
                <Button variant={product.isArchived ? "success" : "danger"} className="px-4" disabled={!isOnline} onClick={() => setArchiveTarget(originalProduct)}>
                  <Archive size={18} />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {cropProduct && imageSrc ? (
        <div className="fixed inset-0 z-50 grid bg-black/75 p-4">
          <Card className="m-auto grid h-[88vh] w-full max-w-lg grid-rows-[auto_1fr_auto] gap-3">
            <div>
              <h2 className="text-xl font-black">Crop {cropProduct.name}</h2>
              <p className="text-sm font-semibold text-[var(--muted)]">Image will upload only after Save</p>
            </div>
            <div className="relative min-h-0 overflow-hidden rounded-lg bg-black">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
              />
            </div>
            <div className="grid gap-3">
              <Field label="Zoom">
                <input type="range" min="1" max="3" step="0.1" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
              </Field>
              <div className="grid grid-cols-3 gap-2">
                {sizes.map((size) => (
                  <Button key={size} variant={imageSize === size ? "primary" : "light"} onClick={() => setImageSize(size)}>
                    {size}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="light" onClick={closeCropper}>
                  Cancel
                </Button>
                <Button onClick={useCroppedImage}>Use Image</Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {archiveTarget ? (
        <Dialog title={`${archiveTarget.isArchived ? "Restore" : "Archive"} ${archiveTarget.name}?`} onClose={() => setArchiveTarget(null)}>
          <p className="text-sm font-semibold text-[var(--muted)]">
            {archiveTarget.isArchived
              ? "This menu item will return to menu management. You can make it available again after restoring."
              : "This menu item will be hidden from POS but kept for old order history."}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="light" onClick={() => setArchiveTarget(null)}>
              Cancel
            </Button>
            <Button variant={archiveTarget.isArchived ? "success" : "danger"} disabled={!isOnline} onClick={() => archiveProduct(archiveTarget)}>
              {archiveTarget.isArchived ? "Restore" : "Archive"}
            </Button>
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}

function MenuToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-[var(--border)] px-3 font-bold">
      {label}
      <ToggleSwitch label={label} checked={checked} onChange={onChange} />
    </label>
  );
}

async function cropImage(imageSrc: string, crop: Area, size: number) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to crop image");
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, size, size);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Unable to create image"))), "image/webp", 0.9);
  });
}
