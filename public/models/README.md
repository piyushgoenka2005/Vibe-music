# GP-9 3D model (optional)

Place a grand-piano GLB here as:

```text
public/models/gp9-grand.glb
```

The Sound Lab / Showcase will **auto-detect** this file (HEAD request).  
No env flag required. To force behavior:

| `NEXT_PUBLIC_GP9_GLB` | Behavior |
|----------------------|----------|
| unset / `auto` | Use GLB when this file exists, else procedural |
| `1` / `true` | Always try GLB (falls back if load fails) |
| `0` / `false` | Always procedural |

## Mesh naming (for live key animation)

Name key meshes so MIDI mapping works:

- `key_21` … `key_108` (MIDI numbers), or
- `key_A0`, `key_Cs4`, etc. (matches Tone note names)

Optional parts (name can contain these substrings):

- lid / top / cover
- pedal_sustain / sustain_pedal
- pedal_soft / soft_pedal
- pedal_sostenuto / sostenuto_pedal

Without named keys, the GLB still renders, but key press animation stays on the procedural fallback path when GLB fails — prefer a model with named keys for Sound Lab.

## License

Ship only models you have rights to redistribute (CC0 / licensed / your own).
