#!/usr/bin/env python3
"""Bulk rebrand Sweetwater HTML content to VibeMusic (keeps CDN image URLs)."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "src" / "content"

PHONE_DISPLAY = "+91 98765 43210"
PHONE_TEL = "+919876543210"
LOGO_PATH = "/brand/vibemusic-logo.svg"

REPLACEMENTS: list[tuple[str, str]] = [
    ("Sweetwater®", "VibeMusic®"),
    ("Sweetwater Sound", "VibeMusic"),
    ("Sweetwater Card", "VibeMusic Card"),
    ("Sweetwater Merch", "VibeMusic Merch"),
    ("Sweetwater Exclusives", "VibeMusic Exclusives"),
    ("About Sweetwater", f"About { 'VibeMusic' }"),
    ("Sweetwater Sales Engineer", "VibeMusic Gear Advisor"),
    ("Sales Engineer", "Gear Advisor"),
    ("Sweetwater Support", "VibeMusic Support"),
    ("Sweetwater's", "VibeMusic's"),
    ("Sweetwater", "VibeMusic"),
    ("(800) 222-4700", PHONE_DISPLAY),
    ("(800) 222-4701", PHONE_DISPLAY),
    ("(260) 432-8176", PHONE_DISPLAY),
    ("(260) 432-1758", PHONE_DISPLAY),
    ("800-222-4700", PHONE_DISPLAY),
    ("8002224700", PHONE_TEL.replace("+", "")),
    ("8002224701", PHONE_TEL.replace("+", "")),
    ('alt="VibeMusic®"', 'alt="VibeMusic"'),
    ("#NewGearDay", "#VibeMusicGear"),
    ("New Gear Day", "VibeMusic Gear"),
    ("this.cartQty", ""),
    ("Your Cart ID is .....", ""),
    ("Cart ID: .....", ""),
    ('src="<>"', 'src="/brand/promo-placeholder.svg"'),
    (">Headline<", ">Featured Deal<"),
]

LOGO_PATTERN = re.compile(
    r'src="https://media\.sweetwater\.com/m/header/logo/sweetwater-logo[^"]*"'
)


def rebrand_text(text: str) -> str:
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    text = LOGO_PATTERN.sub(f'src="{LOGO_PATH}"', text)
    # Rewrite off-site sweetwater links to internal paths (keep media.sweetwater.com images)
    text = re.sub(
        r'href="https?://(?:www\.)?sweetwater\.com([^"]*)"',
        lambda m: f'href="{m.group(1) or "/"}"',
        text,
    )
    return text


def process_file(path: Path) -> bool:
    original = path.read_text(encoding="utf-8")
    updated = rebrand_text(original)
    if updated != original:
        path.write_text(updated, encoding="utf-8")
        return True
    return False


def main() -> int:
    changed = 0
    for path in sorted(CONTENT_DIR.glob("*.html")):
        if process_file(path):
            print(f"Updated {path.name}")
            changed += 1
    print(f"Done. {changed} file(s) updated.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
