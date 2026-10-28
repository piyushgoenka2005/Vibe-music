"use client";

import { useRef, useState } from "react";
import { safeReadApiResponse } from "@/lib/admin/adminFetch";

interface BannerImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
}

export default function BannerImageUpload({ label, value, onChange }: BannerImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function bestEffortDelete(url: string) {
    if (!url) return;
    try {
      void fetch("/api/admin/upload/images/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: [url] }),
      });
    } catch {
      // Best-effort CDN cleanup; ignore failures.
    }
  }

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10MB");
      return;
    }

    setUploading(true);
    setError(null);
    const previousUrl = value;

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload/banner-image", {
        method: "POST",
        body: formData,
      });
      const parsed = await safeReadApiResponse<{ url?: string; error?: string }>(res);
      if (!parsed.ok || !parsed.data?.url) {
        throw new Error(parsed.error ?? "Upload failed");
      }
      onChange(parsed.data.url);
      if (previousUrl && previousUrl !== parsed.data.url) {
        bestEffortDelete(previousUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="admin-form-group">
      <label>{label}</label>
      {value ? (
        <div style={{ marginBottom: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            style={{
              width: "100%",
              maxWidth: 320,
              height: 120,
              objectFit: "cover",
              borderRadius: 8,
              border: "1px solid var(--admin-border)",
            }}
          />
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className="admin-btn admin-btn--secondary"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
        </button>
        {value ? (
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={() => {
              const previousUrl = value;
              onChange("");
              bestEffortDelete(previousUrl);
            }}
          >
            Remove
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadFile(file);
          e.target.value = "";
        }}
      />
      {error ? (
        <p style={{ color: "#c41e3a", fontSize: 13, marginTop: 8 }} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
