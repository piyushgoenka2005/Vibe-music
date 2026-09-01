#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# compress-style-story-videos.sh
#
# Compresses style-story reel MP4s from origin (17+ MB each) down to
# ~2-4 MB mobile-optimized files suitable for CDN delivery.
#
# Prerequisites:
#   brew install ffmpeg        (macOS)
#   apt-get install ffmpeg     (Ubuntu/Debian)
#
# Usage:
#   bash scripts/ops/compress-style-story-videos.sh [--dry-run]
#
# The originals are backed up to public/videos/style-story/originals/
# before any compression. Re-run safely — already-compressed files are
# skipped unless --force is passed.
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

DRY_RUN=false
FORCE=false
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --force)   FORCE=true ;;
    *)         echo "Unknown flag: $arg"; exit 1 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
VIDEO_DIR="$ROOT_DIR/public/videos/style-story"
BACKUP_DIR="$VIDEO_DIR/originals"

TARGET_WIDTH=720
CRF=28
PRESET="slow"
AUDIO_BITRATE="96k"

# ── Preflight ──────────────────────────────────────────────────────
if ! command -v ffmpeg &>/dev/null; then
  echo "❌ ffmpeg not found. Install it first:"
  echo "   brew install ffmpeg   (macOS)"
  echo "   apt-get install ffmpeg (Ubuntu)"
  exit 1
fi

if [ ! -d "$VIDEO_DIR" ]; then
  echo "❌ Video directory not found: $VIDEO_DIR"
  exit 1
fi

# ── Backup originals ───────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

for input in "$VIDEO_DIR"/reel-*.mp4; do
  [ -f "$input" ] || continue
  filename=$(basename "$input")
  backup="$BACKUP_DIR/$filename"

  if [ ! -f "$backup" ]; then
    echo "📦 Backing up original: $filename"
    if [ "$DRY_RUN" = false ]; then
      cp "$input" "$backup"
    fi
  fi
done

# ── Compress ───────────────────────────────────────────────────────
COMPRESSED=0
SKIPPED=0

for input in "$VIDEO_DIR"/reel-*.mp4; do
  [ -f "$input" ] || continue
  filename=$(basename "$input" .mp4)
  output="$VIDEO_DIR/${filename}-opt.mp4"
  original_size=$(du -sh "$input" | cut -f1)

  # Skip if already compressed and not forced
  if [ -f "$output" ] && [ "$FORCE" = false ]; then
    echo "⏭  Skipping ${filename}-opt.mp4 (already exists, use --force to re-compress)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  echo ""
  echo "🎬 Compressing: $filename.mp4 ($original_size)"
  echo "   → ${filename}-opt.mp4 (CRF=$CRF, ${TARGET_WIDTH}p, preset=$PRESET)"

  if [ "$DRY_RUN" = true ]; then
    echo "   [DRY RUN] Would run: ffmpeg -i $input -c:v libx264 -crf $CRF ..."
    continue
  fi

  ffmpeg -i "$input" \
    -c:v libx264 \
    -crf "$CRF" \
    -preset "$PRESET" \
    -c:a aac \
    -b:a "$AUDIO_BITRATE" \
    -vf "scale=${TARGET_WIDTH}:-2" \
    -movflags +faststart \
    -pix_fmt yuv420p \
    -an \
    "$output" \
    -y 2>/dev/null

  new_size=$(du -sh "$output" | cut -f1)
  echo "   ✅ Done: $original_size → $new_size"
  COMPRESSED=$((COMPRESSED + 1))
done

# ── Summary ────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════"
echo "  Video Compression Summary"
echo "════════════════════════════════════════════════"
echo "  Compressed: $COMPRESSED"
echo "  Skipped:    $SKIPPED"
echo "  Backups:    $BACKUP_DIR"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo "  ℹ️  Dry run — no files were modified."
  echo "  Run without --dry-run to execute compression."
fi

echo ""
echo "Next steps:"
echo "  1. Update video src attributes to use ${filename}-opt.mp4 variants"
echo "  2. Or deploy originals to CDN (Bunny.net/Cloudflare Stream)"
echo "     which handles transcoding automatically"
echo "  3. Originals preserved in: $BACKUP_DIR"
