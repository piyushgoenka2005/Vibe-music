"""Point the three new AVUS SKUs at working CDN sibling photos (masters 404)."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FILES = [
    ROOT / "products.json",
    ROOT / "src" / "data" / "catalog" / "products.json",
]


def product_images(data: list[dict], sku: str) -> list[str]:
    product = next(p for p in data if p.get("sku") == sku)
    images = [u for u in (product.get("images") or []) if isinstance(u, str) and u]
    if not images and product.get("image"):
        images = [product["image"]]
    return images


def sync_gallery(product: dict, sources: list[str]) -> None:
    detail = product.get("detail")
    if not isinstance(detail, dict):
        return
    gallery = detail.get("gallery")
    if not isinstance(gallery, list) or not gallery:
        detail["gallery"] = [
            {
                "id": f"img-{index}",
                "alt": f"{product.get('name', '')} view {index + 1}",
                "color": product.get("imageColor", "#e8e8e8"),
                "src": src,
            }
            for index, src in enumerate(sources)
        ]
        return

    for index, item in enumerate(gallery):
        if not isinstance(item, dict):
            continue
        item["src"] = sources[min(index, len(sources) - 1)]

    # Grow gallery to match source count when only placeholders exist
    while len(gallery) < len(sources):
        index = len(gallery)
        gallery.append(
            {
                "id": f"img-{index}",
                "alt": f"{product.get('name', '')} view {index + 1}",
                "color": product.get("imageColor", "#e8e8e8"),
                "src": sources[index],
            }
        )


def patch_product(product: dict, fixes: dict[str, list[str]]) -> bool:
    sku = product.get("sku")
    sources = fixes.get(sku)
    if not sources:
        return False

    product["image"] = sources[0]
    product["images"] = list(sources)
    sync_gallery(product, sources)

    for block in product.get("contentBlocks") or []:
        if block.get("type") != "gallery":
            continue
        block["images"] = [
            {"src": src, "alt": product.get("name", "")} for src in sources
        ]
    return True


def main() -> None:
    seed = json.loads(FILES[0].read_text(encoding="utf-8"))

    # Closest live CDN siblings until own masters are uploaded to the VPS CDN.
    # Import sheet maps "AVUS GENEXT" ↔ Z GEN drumsticks.
    fixes = {
        "VM-AVUSORLIN8": product_images(seed, "VM-AVUSCRYSTONE8"),  # 8" cymbal
        "VM-AVUSZAPCRASH12": product_images(seed, "VM-AVUSZAPCRASH16"),  # same line
        "VM-AVUSGENEXT": product_images(seed, "VM-ZGEN"),  # Z GEN / GENEXT sticks
    }

    for path in FILES:
        data = json.loads(path.read_text(encoding="utf-8"))
        changed = [p["sku"] for p in data if patch_product(p, fixes)]
        path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"{path.name}: updated {changed}")
        for sku, urls in fixes.items():
            print(f"  {sku} -> {urls[0]}")


if __name__ == "__main__":
    main()
