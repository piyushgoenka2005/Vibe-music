# Gear style story reels

Homepage gear-story cards play MP4s from this folder. Until files are present, the UI shows **poster images** (no broken layout).

## Required files

| File | Instagram source (reference) |
|------|------------------------------|
| `reel-1.mp4` | hertzmusicindia reel DY1irHzlrml |
| `reel-2.mp4` | hertzmusicindia reel DX6yk91gCun |
| `reel-3.mp4` | hertzmusicindia reel DXyefWnTR1u |
| `reel-4.mp4` | hertzmusicindia reel DZDKCzlIvux |
| `reel-5.mp4` | hertzmusicindia reel DXeh-R9D-s- |
| `reel-6.mp4` | hertzmusicindia reel DXMnMBDyvdP |

## VPS upload

```bash
# On your machine — copy exported reels to the server
scp reel-*.mp4 root@87.232.72.14:~/Vibe-music/public/videos/style-story/

# On the VPS — verify
cd ~/Vibe-music && npm run verify:gear-videos
```

MP4s are not committed to git (size). Posters are under `public/images/style-story/` (`npm run download:style-story`).
