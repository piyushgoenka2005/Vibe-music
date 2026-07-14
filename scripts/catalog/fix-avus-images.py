"""Replace broken AVUS CDN masters with reachable image URLs."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FILES = [
    ROOT / "products.json",
    ROOT / "src" / "data" / "catalog" / "products.json",
]

BRAND_MARK = "/images/brands/avus.png"

# CDN masters 404 — use brand mark until product photos are re-uploaded.
FIXES = {
    "VM-AVUSGENEXT": {
        "image": BRAND_MARK,
        "images": [BRAND_MARK],
    },
    "VM-AVUSORLIN8": {
        "image": BRAND_MARK,
        "images": [BRAND_MARK],
    },
    "VM-AVUSZAPCRASH12": {
        "image": BRAND_MARK,
        "images": [BRAND_MARK],
    },
}


def sync_gallery(product: dict, sources: list[str]) -> None:
    detail = product.get("detail")
    if not isinstance(detail, dict):
        return
    gallery = detail.get("gallery")
    if not isinstance(gallery, list) or not gallery:
        detail["gallery"] = [
            {
                "id": "img-0",
                "alt": product.get("name", ""),
                "color": product.get("imageColor", "#e8e8e8"),
                "src": sources[0],
            }
        ]
        return

    for index, item in enumerate(gallery):
        if not isinstance(item, dict):
            continue
        item["src"] = sources[min(index, len(sources) - 1)]


def patch_product(product: dict) -> bool:
    sku = product.get("sku")
    fix = FIXES.get(sku)
    if not fix:
        return False

    product["image"] = fix["image"]
    product["images"] = list(fix["images"])
    sync_gallery(product, fix["images"])

    for block in product.get("contentBlocks") or []:
        if block.get("type") != "gallery":
            continue
        images = block.get("images") or []
        for index, image in enumerate(images):
            if index < len(fix["images"]):
                image["src"] = fix["images"][index]
        if not images:
            block["images"] = [
                {"src": src, "alt": product.get("name", "")}
                for src in fix["images"]
            ]
    return True


def main() -> None:
    for path in FILES:
        data = json.loads(path.read_text(encoding="utf-8"))
        changed = [p["sku"] for p in data if patch_product(p)]
        path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"{path}: updated {changed}")


if __name__ == "__main__":
    main()
