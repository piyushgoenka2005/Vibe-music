# Documentation

Essential references for **ViBE Music** (`vibemusic.in`). Deploy and env setup live in the root [`README.md`](../README.md).

## Core

| Doc                                                                        | Purpose                                      |
| -------------------------------------------------------------------------- | -------------------------------------------- |
| [ARCHITECTURE.md](ARCHITECTURE.md)                                         | System design                                |
| [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md)                               | Production incident runbook                  |
| [Vibe_Music_Meta_Pixel_CAPI_Setup.md](Vibe_Music_Meta_Pixel_CAPI_Setup.md) | Meta Pixel + CAPI (Facebook / Instagram ads) |

## Operations

| Resource                                | Purpose            |
| --------------------------------------- | ------------------ |
| [deploy/README.md](../deploy/README.md) | VPS deploy scripts |
| [ops/README.md](ops/README.md)          | Ops runbook index  |

## Audit data

| File                                                     | Purpose                                                   |
| -------------------------------------------------------- | --------------------------------------------------------- |
| [audit/vibemusic_audit.json](audit/vibemusic_audit.json) | Machine-readable audit checklist (`npm run verify:audit`) |

## Templates

| File                                                           | Purpose                   |
| -------------------------------------------------------------- | ------------------------- |
| [templates/vibemusic-bulk.xlsx](templates/vibemusic-bulk.xlsx) | Admin bulk product import |
| [templates/vibemusic-bulk.csv](templates/vibemusic-bulk.csv)   | CSV variant               |

Generate fresh templates: `npm run generate:vibemusic-bulk-template`
