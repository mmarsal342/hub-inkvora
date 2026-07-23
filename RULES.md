# InkVora Hub — Engineering Rules

These are non-negotiable conventions for this codebase, distilled from architecture/design decisions already made. When in doubt, these rules win over local convenience.

## 1. Naming conventions

Follows the established VoraLab pattern of short, tool-scoped prefixes (mirroring `cv_`, `wv_`, `ar_`, `sv_`, `dv_` used across the DreamVora suite):

- Function prefix for Hub-owned logic: `ih_` (InkVora Hub) — e.g. `ih_saveScene()`, `ih_syncPush()`.
- Local storage / DB keys (if any key-value storage is used alongside SQLite): `inkvora_[table]_[entity]`, matching the `voralab_[tool]_[entity]` pattern already in use elsewhere.
- CSS variables are never hardcoded — same rule as the rest of the ecosystem.

## 2. Data integrity rules

- **Entity IDs are immutable and system-generated** (UUID/ULID). Never derive an ID from a name or any user-editable field — names change, IDs must not.
- **No hard deletes on entities.** Always soft-delete (`deleted_at`) first; permanent deletion is a separate, explicit, delayed action (e.g. after a trash retention window).
- **Merge is a redirect, not a destroy.** `merged_into` must be set and reversible; never drop the merged-away entity's row outright.
- **Prose content is never overwritten silently.** Any sync conflict touching manuscript text must preserve both versions and require writer review — see ARCHITECTURE.md §4 and DESIGN.md §6.
- **Structured fields may use last-write-wins**, but only for short, low-collision-risk fields (entity traits, relation type, timeline metadata) — never for prose.
- Timestamps stored in a single consistent format (ISO 8601) across local SQLite and D1.

## 3. Security rules

- Electron: `contextIsolation: true` and `nodeIntegration: false` at all times, with no exceptions — even before any `<webview>` embed exists, this is the baseline.
- All Main↔Renderer communication goes through a `contextBridge`-exposed API with an explicit, narrow function surface — never expose raw Node or Electron APIs to the Renderer.
- When DreamVora is eventually embedded as a `<webview>` panel, it must remain isolated from the Hub's own filesystem/DB access — no shared context between third-party web content and local data.
- No secrets, tokens, or credentials committed to the repository or hardcoded in Renderer-accessible code. Auth tokens used for DreamVora handover are short-lived and validated server-side (Worker), never trusted client-side alone.

## 4. Sync rules

- Sync is **batched**, never per-keystroke. Debounce on idle (~5–10s), plus explicit triggers on blur/close, pre-handover, manual request, and app launch (pull).
- Sync granularity is **scene-level**, not whole-manuscript — this bounds the impact of any conflict to a single scene.
- D1/Worker is a backup, cross-device, and DreamVora-bridge layer — **never the primary write path** for day-to-day writing. The writer must be able to work fully offline.

## 5. Schema extensibility rules

- `project.format` is an open enum. Adding a new format value (e.g. `screenplay`) must never require a migration of existing data.
- No core table may bake in an assumption that only applies to prose (e.g. a `word_count`-only metric on `unit`) — format-specific fields are additive, not foundational.
- Cross-cutting concerns get their own table rather than overloading an existing one (e.g. `event_participants` for N-ary event involvement vs. `relation` for binary entity-to-entity ties) — see SCHEMA.md §5–7.

## 6. Licensing (pending decision — not yet a rule)

Before this repository is made public, a licensing decision is required. A source-available/custom license is under consideration over a permissive license (MIT), to preserve future commercialization options for the engine independent of the free InkVora Hub app. This section will be updated once a decision is made — do not assume MIT by default.
