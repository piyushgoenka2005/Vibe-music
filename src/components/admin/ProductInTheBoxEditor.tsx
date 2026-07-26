"use client";

interface ProductInTheBoxEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
}

export default function ProductInTheBoxEditor({
  items,
  onChange,
}: ProductInTheBoxEditorProps) {
  const lines = items.length > 0 ? items : [""];

  function updateLine(index: number, text: string) {
    const next = [...lines];
    next[index] = text;
    if (index === next.length - 1 && text.trim()) next.push("");
    while (
      next.length > 2 &&
      next[next.length - 1] === "" &&
      next[next.length - 2] === ""
    ) {
      next.pop();
    }
    onChange(next);
  }

  function removeLine(index: number) {
    if (lines.length <= 1) {
      onChange([""]);
      return;
    }
    onChange(lines.filter((_, i) => i !== index));
  }

  return (
    <div className="admin-form-group admin-form-grid--full">
      <label>In The Box</label>
      <p className="admin-form-hint">
        Package contents shown on the product page. Leave empty to show “not listed”.
      </p>
      <div className="admin-description-bullets">
        {lines.map((line, index) => (
          <div key={`box-${index}`} className="admin-description-bullets__row">
            <span className="admin-description-bullets__marker" aria-hidden>
              •
            </span>
            <input
              type="text"
              className="admin-input admin-description-bullets__input"
              value={line}
              placeholder={index === 0 ? "e.g. Instrument body" : "Next item…"}
              onChange={(e) => updateLine(index, e.target.value)}
            />
            {lines.length > 1 || line.trim() ? (
              <button
                type="button"
                className="admin-btn admin-btn--ghost admin-description-bullets__remove"
                aria-label={`Remove item ${index + 1}`}
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
