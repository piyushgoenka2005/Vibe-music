# Style Story Reels

This directory holds the Instagram-style reel MP4s used by the Gear Stories
section on the homepage.

## Naming Convention

```
reel-1.mp4   ← Original (may be 17+ MB)
reel-2.mp4
reel-3.mp4
reel-4.mp4
reel-5.mp4
reel-6.mp4

reel-1-opt.mp4  ← Compressed variant (~2-4 MB, 720p)
reel-2-opt.mp4
...
```

## Compression

Run the compression script to create mobile-optimized variants:

```bash
bash scripts/ops/compress-style-story-videos.sh
```

Options:

- `--dry-run` — Preview what would happen without modifying files
- `--force` — Re-compress even if `-opt.mp4` already exists

Originals are backed up to `public/videos/style-story/originals/` before
any compression runs.

## CDN Deployment

For production, these videos should be served from CDN (not origin):

1. **VPS CDN** (production): Copy `-opt.mp4` files to `/var/www/cdn/videos/style-story/`
   on the CloudOnFire VPS and set `src` to `https://cdn.vibemusic.in/videos/style-story/...`.

2. **Origin serving** (current fallback): The `-opt.mp4` variants with
   `preload="metadata"` and visibility-gated playback minimize impact.

## Video Specs

| Property   | Original | Compressed                         |
| ---------- | -------- | ---------------------------------- |
| Codec      | varies   | H.264                              |
| CRF        | —        | 28                                 |
| Resolution | varies   | 720p max                           |
| Audio      | varies   | AAC 96kbps (stripped for autoplay) |
| Faststart  | no       | yes                                |
| Size       | ~17 MB   | ~2-4 MB                            |
