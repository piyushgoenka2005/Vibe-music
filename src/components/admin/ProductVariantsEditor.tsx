"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  buildVariantLabel,
  createVariantId,
  generateVariantSku,
} from "@/lib/variants";
import type { ProductVariant, VariantAttribute, VariantAttributeType } from "@/types/product";

const ATTRIBUTE_TYPES: Array<{ value: VariantAttributeType; label: string }> = [
  { value: "color", label: "Color" },
  { value: "size", label: "Size" },
  { value: "finish", label: "Finish" },
  { value: "custom", label: "Custom" },
];

const EMPTY_ATTRIBUTE: VariantAttribute = {
  type: "color",
  name: "Color",
  value: "",
};

interface ProductVariantsEditorProps {
  parentSku: string;
  basePrice: number;
  variants: ProductVariant[];
  productImages: string[];
  onChange: (variants: ProductVariant[]) => void;
}

function defaultAttributeName(type: VariantAttributeType): string {
  switch (type) {
    case "color":
      return "Color";
    case "size":
      return "Size";
    case "finish":
      return "Finish";
    default:
      return "Option";
  }
}

function createEmptyVariant(
  parentSku: string,
  basePrice: number,
  existing: ProductVariant[],
  isDefault = false
): ProductVariant {
  const skus = new Set(existing.map((variant) => variant.sku));
  return {
    id: createVariantId(),
    label: "New Variant",
    sku: generateVariantSku(parentSku, [], skus),
    price: basePrice,
    stock: 0,
    availability: "out-of-stock",
    attributes: [{ ...EMPTY_ATTRIBUTE }],
    images: [],
    isDefault,
  };
}

export default function ProductVariantsEditor({
  parentSku,
  basePrice,
  variants,
  productImages,
  onChange,
}: ProductVariantsEditorProps) {
  function updateVariant(index: number, patch: Partial<ProductVariant>) {
    const next = variants.map((variant, i) => {
      if (i !== index) {
        return patch.isDefault ? { ...variant, isDefault: false } : variant;
      }
      const updated = { ...variant, ...patch };
      if (patch.attributes) {
        updated.label = buildVariantLabel(patch.attributes);
        if (!patch.sku) {
          const skus = new Set(variants.map((entry) => entry.sku));
          updated.sku = generateVariantSku(parentSku, patch.attributes, skus);
        }
      }
      updated.availability =
        updated.stock <= 0
          ? "out-of-stock"
          : updated.stock <= 5
            ? "limited"
            : "in-stock";
      return updated;
    });
    onChange(next);
  }

  function removeVariant(index: number) {
    const next = variants.filter((_, i) => i !== index);
    if (next.length > 0 && !next.some((variant) => variant.isDefault)) {
      next[0] = { ...next[0]!, isDefault: true };
    }
    onChange(next);
  }

  function addVariant() {
    onChange([
      ...variants,
      createEmptyVariant(parentSku, basePrice, variants, variants.length === 0),
    ]);
  }

  function updateAttribute(
    variantIndex: number,
    attributeIndex: number,
    patch: Partial<VariantAttribute>
  ) {
    const variant = variants[variantIndex];
    if (!variant) return;
    const attributes = variant.attributes.map((attr, i) =>
      i === attributeIndex
        ? {
            ...attr,
            ...patch,
            name:
              patch.type !== undefined
                ? defaultAttributeName(patch.type)
                : patch.name ?? attr.name,
          }
        : attr
    );
    updateVariant(variantIndex, { attributes });
  }

  function addAttribute(variantIndex: number) {
    const variant = variants[variantIndex];
    if (!variant) return;
    updateVariant(variantIndex, {
      attributes: [...variant.attributes, { ...EMPTY_ATTRIBUTE }],
    });
  }

  function removeAttribute(variantIndex: number, attributeIndex: number) {
    const variant = variants[variantIndex];
    if (!variant || variant.attributes.length <= 1) return;
    updateVariant(variantIndex, {
      attributes: variant.attributes.filter((_, i) => i !== attributeIndex),
    });
  }

  return (
    <div className="admin-panel" style={{ marginTop: "1rem" }}>
      <div className="admin-panel__header">
        <h2 className="admin-panel__title">Product Variants</h2>
        <button type="button" className="admin-btn admin-btn--secondary" onClick={addVariant}>
          <Plus size={16} /> Add Variant
        </button>
      </div>
      <div className="admin-panel__body">
        {variants.length === 0 ? (
          <p style={{ color: "var(--admin-muted)" }}>
            No variants yet. A default Standard variant is created automatically if none are added.
          </p>
        ) : (
          variants.map((variant, variantIndex) => (
            <div
              key={variant.id}
              style={{
                border: "1px solid var(--admin-border)",
                borderRadius: 12,
                padding: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.75rem",
                  gap: "0.75rem",
                }}
              >
                <strong>{variant.label || `Variant ${variantIndex + 1}`}</strong>
                <div style={{ display: "flex", gap: 8 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="radio"
                      name="default-variant"
                      checked={Boolean(variant.isDefault)}
                      onChange={() => updateVariant(variantIndex, { isDefault: true })}
                    />
                    Default
                  </label>
                  <button
                    type="button"
                    className="admin-btn admin-btn--danger"
                    onClick={() => removeVariant(variantIndex)}
                    disabled={variants.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>SKU</label>
                  <input
                    className="admin-input"
                    style={{ width: "100%" }}
                    value={variant.sku}
                    onChange={(e) => updateVariant(variantIndex, { sku: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Price (INR)</label>
                  <input
                    className="admin-input"
                    type="number"
                    min={0}
                    style={{ width: "100%" }}
                    value={variant.price}
                    onChange={(e) =>
                      updateVariant(variantIndex, { price: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="admin-form-group">
                  <label>Stock</label>
                  <input
                    className="admin-input"
                    type="number"
                    min={0}
                    style={{ width: "100%" }}
                    value={variant.stock}
                    onChange={(e) =>
                      updateVariant(variantIndex, { stock: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div style={{ marginTop: "1rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <strong>Attributes</strong>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    onClick={() => addAttribute(variantIndex)}
                  >
                    <Plus size={14} /> Add Attribute
                  </button>
                </div>
                {variant.attributes.map((attr, attributeIndex) => (
                  <div
                    key={`${variant.id}-${attributeIndex}`}
                    className="admin-form-grid"
                    style={{ marginBottom: 8 }}
                  >
                    <div className="admin-form-group">
                      <label>Type</label>
                      <select
                        className="admin-select"
                        value={attr.type}
                        onChange={(e) =>
                          updateAttribute(variantIndex, attributeIndex, {
                            type: e.target.value as VariantAttributeType,
                          })
                        }
                      >
                        {ATTRIBUTE_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label>Name</label>
                      <input
                        className="admin-input"
                        style={{ width: "100%" }}
                        value={attr.name}
                        onChange={(e) =>
                          updateAttribute(variantIndex, attributeIndex, {
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Value</label>
                      <input
                        className="admin-input"
                        style={{ width: "100%" }}
                        value={attr.value}
                        onChange={(e) =>
                          updateAttribute(variantIndex, attributeIndex, {
                            value: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="admin-form-group" style={{ alignSelf: "end" }}>
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost"
                        onClick={() => removeAttribute(variantIndex, attributeIndex)}
                        disabled={variant.attributes.length <= 1}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "1rem" }}>
                <label>Variant Images (URLs)</label>
                <div className="admin-form-grid">
                  {(variant.images.length > 0 ? variant.images : [""]).map(
                    (image, imageIndex) => (
                      <div key={`${variant.id}-img-${imageIndex}`} className="admin-form-group">
                        <input
                          className="admin-input"
                          style={{ width: "100%" }}
                          value={image}
                          placeholder="https://..."
                          onChange={(e) => {
                            const images = [...(variant.images.length ? variant.images : [""])];
                            images[imageIndex] = e.target.value;
                            updateVariant(variantIndex, {
                              images: images.filter(Boolean),
                            });
                          }}
                        />
                      </div>
                    )
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    onClick={() =>
                      updateVariant(variantIndex, {
                        images: [...variant.images, ""],
                      })
                    }
                  >
                    Add Image URL
                  </button>
                  {productImages[0] ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost"
                      onClick={() =>
                        updateVariant(variantIndex, {
                          images: [...new Set([...variant.images, ...productImages])].filter(
                            Boolean
                          ),
                        })
                      }
                    >
                      Copy Product Images
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
