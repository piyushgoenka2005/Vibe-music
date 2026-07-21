"use client";

import { useCallback, useRef, useState } from "react";

interface ProductImageUploadProps {
  categorySlug: string;
  images: string[];
  onChange: (images: string[]) => void;
}

export default function ProductImageUpload({
  categorySlug,
  images,
  onChange,
}: ProductImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (list.length === 0) return;

      setUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append("categorySlug", categorySlug || "general");
      list.forEach((file) => formData.append("files", file));

      try {
        const res = await fetch("/api/admin/upload/images", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        onChange([...images, ...(data.urls as string[])]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [categorySlug, images, onChange]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }

  async function removeImage(index: number) {
    const next = images.filter((_, i) => i !== index);
    const url = images[index];
    onChange(next);

    if (!url) return;

    try {
      void fetch("/api/admin/upload/images/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ urls: [url] }),
      });
    } catch {
      // Best-effort cleanup; ignore failures.
    }
  }

  return (
    <div className="admin-form-group admin-form-grid--full">
      <label>Product Images</label>
      <div
        className={`admin-upload-zone${dragOver ? " admin-upload-zone--active" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter") inputRef.current?.click(); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        <p>{uploading ? "Uploading…" : "Drag & drop images here, or click to select"}</p>
        <p style={{ fontSize: "0.75rem", color: "var(--admin-muted)" }}>
          Images upload to the Vibe CDN. Supports multiple images.
        </p>
      </div>

      {error ? <p className="admin-form-error">{error}</p> : null}

      {images.length > 0 ? (
        <div className="admin-image-preview-grid">
          {images.map((url, index) => (
            <div key={`${url}-${index}`} className="admin-image-preview">
              <img src={url} alt={`Product ${index + 1}`} />
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                style={{ marginTop: "0.5rem", width: "100%" }}
                onClick={() => removeImage(index)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
