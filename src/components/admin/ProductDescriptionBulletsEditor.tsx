"use client";

import { useState } from "react";
import {
  bulletLinesToDescription,
  descriptionToBulletLines,
} from "@/lib/product/formatProductDescription";

interface ProductDescriptionBulletsEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ProductDescriptionBulletsEditor({
  value,
  onChange,
}: ProductDescriptionBulletsEditorProps) {
  const [lines, setLines] = useState(() => descriptionToBulletLines(value));

  function commit(nextLines: string[]) {
    const normalized =
      nextLines.length > 0 ? nextLines : [""];
    const withTrailingEmpty =
      normalized[normalized.length - 1]?.trim() === ""
        ? normalized
        : [...normalized, ""];
    setLines(withTrailingEmpty);
    onChange(bulletLinesToDescription(withTrailingEmpty));
  }

  function updateLine(index: number, text: string) {
    const next = [...lines];
    next[index] = text;

    if (index === next.length - 1 && text.trim()) {
      next.push("");
    }

    while (
      next.length > 2 &&
      next[next.length - 1] === "" &&
      next[next.length - 2] === ""
    ) {
      next.pop();
    }

    commit(next);
  }

  function removeLine(index: number) {
    if (lines.length <= 1) {
      commit([""]);
      return;
    }
    const next = lines.filter((_, i) => i !== index);
    commit(next.length > 0 ? next : [""]);
  }

  return (
    <div className="admin-form-group admin-form-grid--full">
      <label>Description</label>
      <p className="admin-form-hint">
        Add one bullet per line. A new line appears automatically when you start typing.
      </p>
      <div className="admin-description-bullets">
        {lines.map((line, index) => (
          <div key={`bullet-${index}`} className="admin-description-bullets__row">
            <span className="admin-description-bullets__marker" aria-hidden="true">
              •
            </span>
            <input
              type="text"
              className="admin-input admin-description-bullets__input"
              value={line}
              placeholder={index === 0 ? "First bullet point…" : "Next bullet point…"}
              onChange={(e) => updateLine(index, e.target.value)}
            />
            {lines.length > 1 || line.trim() ? (
              <button
                type="button"
                className="admin-btn admin-btn--ghost admin-description-bullets__remove"
                aria-label={`Remove bullet ${index + 1}`}
                onClick={() => removeLine(index)}
              >
                Remove
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
