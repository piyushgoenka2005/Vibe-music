import { formatDisplayPrice } from "@/utils/currency";
import {
  availabilityLabel,
  conditionLabel,
  collectSpecLabels,
  specValue,
} from "@/lib/compare/compareEngine";
import type { CompareItemRecord } from "@/types/compare";

export function buildCompareExportHtml(input: {
  items: CompareItemRecord[];
  specsBySlug: Record<string, Array<{ label: string; value: string }>>;
  conditionsBySlug: Record<string, string>;
  title?: string;
}): string {
  const specLabels = collectSpecLabels(input.specsBySlug);
  const title = input.title ?? "Product Comparison";

  const headerCells = input.items
    .map((item) => `<th scope="col">${escapeHtml(item.name)}</th>`)
    .join("");

  const rows: Array<{ label: string; values: string[] }> = [
    { label: "Brand", values: input.items.map((i) => i.brand) },
    { label: "Price", values: input.items.map((i) => formatDisplayPrice(i.price)) },
    {
      label: "Condition",
      values: input.items.map((i) => conditionLabel(input.conditionsBySlug[i.slug])),
    },
    {
      label: "Rating",
      values: input.items.map((i) =>
        i.reviewCount > 0 ? `${i.rating.toFixed(1)} (${i.reviewCount})` : "—"
      ),
    },
    {
      label: "Availability",
      values: input.items.map((i) => availabilityLabel(i.availability)),
    },
    ...specLabels.map((label) => ({
      label,
      values: input.items.map((i) => specValue(input.specsBySlug, i.slug, label)),
    })),
  ];

  const bodyRows = rows
    .map(
      (row) => `
    <tr>
      <th scope="row">${escapeHtml(row.label)}</th>
      ${row.values.map((v) => `<td>${escapeHtml(v)}</td>`).join("")}
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
    h1 { font-size: 1.25rem; margin-bottom: 1rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; }
    @media print {
      body { margin: 12px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="no-print">Use your browser print dialog to save as PDF.</p>
  <table>
    <thead><tr><th scope="col">Feature</th>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <script class="no-print">if (new URLSearchParams(location.search).get('print') === '1') window.print();</script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
