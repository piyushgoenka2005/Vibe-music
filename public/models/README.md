# GP-9 Grand Piano GLB

Drop a Draco-compressed grand piano model at:

```
public/models/gp9-grand.glb
```

The app loads it via `useGLTF` in `components/gp9-scene.tsx` (`PianoModelGlb`).
If the file is missing or loading fails, `PianoModelUnified` falls back to the
procedural `PianoModel` geometry automatically.

Disable GLB loading (procedural only) with:

```
NEXT_PUBLIC_GP9_GLB=0
```

## Expected scene structure

| Node name | Required | Notes |
|-----------|----------|-------|
| `key_<NoteName>` | Per key | e.g. `key_A0`, `key_C4`, `key_Cs4` (C#) — matches `midiToNoteName()` in `lib/gp9-runtime.ts` |
| `key_<MIDI>` | Alt naming | e.g. `key_60`, `key_21` (numeric MIDI 21–108) |
| `lid` | Optional | Animated on lid-open slider |
| `body` | Optional | Cabinet mesh |
| `pedal_sustain` | Optional | Center sustain pedal |
| `pedal_soft` | Optional | Left soft pedal |
| `pedal_sostenuto` | Optional | Right sostenuto pedal |

Aliases are also accepted — see `GP9_PART_NAMES` in `lib/gp9-runtime.ts`.

## Blender export checklist

1. Select each of the 88 keys → **Separate > Selection**
2. Name each mesh `key_A0` … `key_C8` using the note-name format above
3. Apply transforms (Ctrl+A → All Transforms)
4. Decimate to stay under ~50k triangles total for 60fps on mid-tier GPUs
5. Export GLB with **Draco compression** enabled
6. Place at `public/models/gp9-grand.glb` — no code changes needed

## Licensing

Do not ship a scanned/ripped Roland GP-9 model. Use CC-BY / CC0 generic grand
piano assets from Sketchfab or similar, re-exported with separated key meshes.
