"use client";

import { useRef, useState, type DragEvent } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { MAX_ADMIN_IMAGE_MB } from "@/lib/admin/image-limits";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  hint?: string;
  accept?: string;
  previewUrl?: string | null;
  previewFile?: File | null;
  busy?: boolean;
  onFile: (file: File | null) => void;
  onRemove?: () => void;
  aspectClass?: string;
  compact?: boolean;
};

export function ImageDropzone({
  label = "صورة المنتج",
  hint = `JPG / PNG / WebP · حتى ${MAX_ADMIN_IMAGE_MB} ميجابايت`,
  accept = "image/jpeg,image/png,image/webp,image/avif",
  previewUrl,
  previewFile,
  busy,
  onFile,
  onRemove,
  aspectClass = "aspect-[4/5]",
  compact,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const localPreview = previewFile ? URL.createObjectURL(previewFile) : null;
  const src = localPreview || previewUrl || null;

  function take(file: File | null | undefined) {
    if (!file) return;
    onFile(file);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    take(e.dataTransfer.files?.[0]);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          take(e.target.files?.[0]);
          e.currentTarget.value = "";
        }}
      />

      {src ? (
        <div className="space-y-3">
          <div
            className={cn(
              "relative overflow-hidden rounded-[16px] border border-[var(--admin-border)] bg-[var(--admin-surface-soft)]",
              aspectClass,
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={label}
              className={compact ? "h-full w-full object-contain p-4" : "h-full w-full object-cover"}
            />
            <span className="absolute bottom-3 end-3 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-medium text-[var(--admin-plum)] backdrop-blur">
              الصورة الرئيسية
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-9 items-center gap-1.5 rounded-[11px] border border-[var(--admin-border)] bg-white px-3 text-[12.5px] font-medium transition hover:border-[var(--admin-plum-soft)] disabled:opacity-40"
            >
              <Upload className="size-3.5" strokeWidth={1.7} />
              {busy ? "جارٍ الرفع…" : "استبدال"}
            </button>
            {onRemove ? (
              <button
                type="button"
                disabled={busy}
                onClick={onRemove}
                className="inline-flex h-9 items-center gap-1.5 rounded-[11px] border border-[var(--admin-danger)]/20 bg-[var(--admin-danger-bg)] px-3 text-[12.5px] font-medium text-[var(--admin-danger)] disabled:opacity-40"
              >
                <Trash2 className="size-3.5" strokeWidth={1.7} />
                حذف
              </button>
            ) : previewFile ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onFile(null)}
                className="inline-flex h-9 items-center gap-1.5 rounded-[11px] border border-[var(--admin-danger)]/20 bg-[var(--admin-danger-bg)] px-3 text-[12.5px] font-medium text-[var(--admin-danger)] disabled:opacity-40"
              >
                <Trash2 className="size-3.5" strokeWidth={1.7} />
                إزالة
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragging(false);
          }}
          onDrop={onDrop}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed px-6 text-center transition duration-200",
            aspectClass,
            dragging
              ? "border-[var(--admin-plum)] bg-[var(--admin-plum)]/[0.04]"
              : "border-[var(--admin-border-strong)] bg-[var(--admin-bg-elevated)] hover:border-[var(--admin-plum-soft)]",
            busy && "opacity-50",
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-white text-[var(--admin-plum)] shadow-[var(--admin-shadow)]">
            <ImagePlus className="size-5" strokeWidth={1.55} />
          </span>
          <span>
            <span className="block text-[14px] font-medium text-[var(--admin-text)]">
              {busy ? "جارٍ الرفع…" : "اسحبي الصورة أو اضغطي للرفع"}
            </span>
            <span className="mt-1 block text-[12px] text-[var(--admin-text-muted)]">
              {hint}
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
