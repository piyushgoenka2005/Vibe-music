"use client";

import { useMemo, useRef, useState } from "react";
import { safeReadApiResponse } from "@/lib/admin/adminFetch";
import {
  IMAGE_SPECS,
  imageSpecRatio,
  isNearImageSpecRatio,
  type ImageSpec,
} from "@/lib/admin/imageSpecs";

interface BannerImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** Storefront frame this image lands in. Defaults to a generic 16:9 spec. */
  spec?: ImageSpec;
  disabled?: boolean;
}

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

export default function BannerImageUpload({
  label,
  value,
  onChange,
  spec = IMAGE_SPECS.generic,
  disabled = false,
}: BannerImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewState, setPreviewState] = useState<{
    url: string;
    natural: { width: number; height: number } | null;
    error: boolean;
  }>({ url: value, natural: null, error: false });
  const [draft, setDraft] = useState({ value, text: value });

  // Derived state: when the parent swaps the image, stale preview metadata and typed
  // URL text reset without an effect (which would cause a cascading render).
  const natural = previewState.url === value ? previewState.natural : null;
  const imgError = previewState.url === value ? previewState.error : false;
  const urlDraft = draft.value === value ? draft.text : value;

  const ratioWarning = useMemo(() => {
    if (!natural) return null;
    if (!isNearImageSpecRatio(natural.width, natural.height, spec)) {
      return `This image is ${natural.width}×${natural.height} (${(natural.width / natural.height).toFixed(2)}:1). The slot is ${spec.ratioLabel}; it will be cropped or letterboxed.`;
    }
    if (
      natural.width < spec.recommendedWidth * 0.6 ||
      natural.height < spec.recommendedHeight * 0.6
    ) {
      return `This image is below the recommended ${spec.recommendedWidth}×${spec.recommendedHeight}px and may look soft on high-DPI screens.`;
    }
    return null;
  }, [natural, spec]);

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please select a JPG, PNG, or WebP image");
      return;
    }
    if (file.size > spec.maxUploadMb * 1024 * 1024) {
      setError(`Image must be smaller than ${spec.maxUploadMb}MB`);
      return;
    }

    setUploading(true);
    setError(null);
    const previousUrl = value;

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(spec.endpoint, {
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

  function commitUrl() {
    const next = urlDraft.trim();
    if (next !== value) onChange(next);
  }

  return (
    <div className="admin-form-group">
      <label>{label}</label>
      <p className="admin-form-hint" style={{ margin: "0 0 0.625rem" }}>
        <strong>{spec.ratioLabel}</strong> · Recommended{" "}
        <strong>
          {spec.recommendedWidth} × {spec.recommendedHeight} px
        </strong>{" "}
        · JPG/PNG/WebP up to {spec.maxUploadMb} MB
        <br />
        {spec.hint}
      </p>

      {value ? (
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              width: "100%",
              maxWidth: spec.previewMaxWidth ?? 420,
              aspectRatio: imageSpecRatio(spec.aspectRatio),
              borderRadius: 8,
              border: "1px solid var(--admin-border)",
              background: spec.previewBackground ?? "var(--admin-surface-2, #111)",
              overflow: "hidden",
            }}
          >
            {imgError ? (
              <p
                style={{
                  margin: 0,
                  padding: "1rem",
                  fontSize: 13,
                  color: "var(--admin-muted, #6b7280)",
                }}
              >
                Preview unavailable — the URL may be invalid or blocked.
              </p>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value}
                alt=""
                onLoad={(event) => {
                  const img = event.currentTarget;
                  setPreviewState({
                    url: value,
                    natural: { width: img.naturalWidth, height: img.naturalHeight },
                    error: false,
                  });
                }}
                onError={() => setPreviewState({ url: value, natural: null, error: true })}
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  objectFit: spec.fit,
                  objectPosition: "center center",
                }}
              />
            )}
          </div>
          <p
            className="admin-form-hint"
            style={{ margin: "0.4rem 0 0", display: "flex", gap: 6, flexWrap: "wrap" }}
          >
            {natural ? (
              <span>
                Current: {natural.width} × {natural.height} px
              </span>
            ) : null}
            {ratioWarning ? (
              <span style={{ color: "#b45309" }}>
                {natural ? "· " : ""}
                {ratioWarning}
              </span>
            ) : natural ? (
              <span style={{ color: "#15803d" }}>· Matches the slot ratio</span>
            ) : null}
          </p>
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className="admin-btn admin-btn--secondary"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || disabled}
        >
          {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
        </button>
        {value ? (
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            disabled={uploading || disabled}
            onClick={() => {
              const previousUrl = value;
              setDraft({ value: "", text: "" });
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
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadFile(file);
          e.target.value = "";
        }}
      />

      <label style={{ display: "block", marginTop: 10, marginBottom: 4 }}>
        Or paste an image URL / path
      </label>
      <input
        className="admin-input"
        style={{ width: "100%" }}
        type="text"
        value={urlDraft}
        placeholder="https://cdn.vibemusic.in/… or /images/…"
        disabled={disabled}
        onChange={(event) => setDraft({ value, text: event.target.value })}
        onBlur={commitUrl}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitUrl();
          }
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
