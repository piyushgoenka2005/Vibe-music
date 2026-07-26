"use client";

import type { ProductVideo } from "@/types/product";

interface ProductVideosEditorProps {
  videos: ProductVideo[];
  onChange: (videos: ProductVideo[]) => void;
}

function emptyVideo(index: number): ProductVideo {
  return {
    id: `video-${Date.now().toString(36)}-${index}`,
    title: "",
    thumbnailColor: "#1a1a1a",
    embedUrl: "",
  };
}

export default function ProductVideosEditor({
  videos,
  onChange,
}: ProductVideosEditorProps) {
  function updateVideo(
    index: number,
    patch: Partial<Pick<ProductVideo, "title" | "embedUrl">>
  ) {
    const next = videos.map((video, i) =>
      i === index ? { ...video, ...patch } : video
    );
    onChange(next);
  }

  function addVideo() {
    onChange([...videos, emptyVideo(videos.length)]);
  }

  function removeVideo(index: number) {
    onChange(videos.filter((_, i) => i !== index));
  }

  return (
    <div className="admin-form-group admin-form-grid--full">
      <label>Product videos</label>
      <p className="admin-form-hint">
        YouTube/Vimeo embed URLs shown on the product page Videos tab.
      </p>
      {videos.map((video, index) => (
        <div
          key={video.id}
          style={{
            display: "grid",
            gap: "0.5rem",
            marginBottom: "0.75rem",
            paddingBottom: "0.75rem",
            borderBottom: "1px solid var(--admin-border, #e5e5e5)",
          }}
        >
          <input
            type="text"
            className="admin-input"
            style={{ width: "100%" }}
            value={video.title}
            placeholder="Video title"
            onChange={(e) => updateVideo(index, { title: e.target.value })}
          />
          <input
            type="url"
            className="admin-input"
            style={{ width: "100%" }}
            value={video.embedUrl}
            placeholder="https://www.youtube.com/embed/…"
            onChange={(e) => updateVideo(index, { embedUrl: e.target.value })}
          />
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={() => removeVideo(index)}
          >
            Remove video
          </button>
        </div>
      ))}
      <button type="button" className="admin-btn admin-btn--secondary" onClick={addVideo}>
        Add video
      </button>
    </div>
  );
}
