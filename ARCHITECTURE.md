# InkVora Hub — Architecture

## 1. System overview

```
┌─────────────────────────────────────────────┐
│              Electron App (Hub)             │
│  ┌────────────┐        ┌──────────────────┐ │
│  │   Main      │  IPC   │    Renderer      │ │
│  │  process    │◄──────►│  (Svelte/Preact  │ │
│  │             │preload │   + TipTap)      │ │
│  │ better-     │contextB│                  │ │
│  │ sqlite3     │ridge   │  UI only, no FS  │ │
│  └─────┬───────┘        │  access          │ │
│        │                └──────────────────┘ │
└────────┼─────────────────────────────────────┘
         │ background sync (batched)
         ▼
┌─────────────────────┐        ┌───────────────────┐
│ Cloudflare Worker    │◄──────►│  D1 (SQLite edge)  │
│ (auth, sync, bridge) │        │  backup + cross-   │
└─────────┬────────────┘        │  device + handover │
          │                     └───────────────────┘
          ▼
┌──────────────────────┐
│ Gemini Canvas         │
│ (DreamVora — paid,    │
│  external, AI layer)  │
└──────────────────────┘
```

**Guiding split:** InkVora Hub (this repo) owns structure, storage, and writing. DreamVora owns AI generation and lives outside this codebase, on Gemini Canvas. The two communicate only through the Worker/D1 bridge — never directly.

## 2. Electron process model

- **Main process**: owns the SQLite connection (`better-sqlite3`), runs all queries, owns the sync engine (push/pull to Worker).
- **Renderer process**: UI only. No direct filesystem or Node API access.
- **Preload script**: the only bridge between the two, exposed via `contextBridge` with a narrow, explicit API (e.g. `window.hub.getEntity(id)`, `window.hub.saveScene(data)`) — never the raw Node/Electron API surface.

**Security requirement (non-negotiable):** `contextIsolation: true`, `nodeIntegration: false`, always. This matters even more once DreamVora is embedded as a side-panel `<webview>` (see §5) — without isolation, third-party web content sharing the app window could reach the filesystem.

## 3. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Shell | Electron | Cross-platform (Mac/Windows) native distribution, already proven with the current Gemini Canvas wrapper |
| Renderer framework | Svelte or Preact | Lean runtime, avoids full React overhead; Svelte syntax stays close to the single-HTML-file authoring style already used across *Vora tools |
| Editor | TipTap (core, vanilla) | ProseMirror-based, extensible via custom nodes (needed for `@mention` entity-linking), works without a framework binding |
| Local storage | SQLite via `better-sqlite3` | Synchronous API, mature, standard for Electron production apps |
| Backend (sync/backup/auth) | Cloudflare Workers + D1 | Matches existing VoraLab infra pattern (InkVora Hub's own D1, separate from other *Vora products per established convention) |
| Dev tooling | electron-vite | Modern HMR/dev experience, active maintenance vs. legacy electron-webpack |
| Packaging | electron-builder | `.dmg` / `.exe` output, auto-update path if needed later |

## 4. Local-first + sync philosophy

**SQLite (local) is the source of truth for the writer's day-to-day work. D1 is a backup/sync/bridge layer, not where writing happens.**

Writers must be able to write, edit entities, and manage relations **fully offline**. Connectivity is only required for:
1. DreamVora handover (Gemini Canvas requires internet regardless),
2. cross-device sync,
3. backup/safety-net.

### Sync triggers
- Debounced idle (~5–10s after typing stops) — batch all `dirty` rows.
- App blur/minimize/close — forced sync attempt if online.
- Immediately before opening a DreamVora handover — ensures the Worker serves fresh context.
- Manual "Sync Now" — for a writer switching devices deliberately.
- App launch — background pull from D1, app remains usable on local data meanwhile.

### Granularity
Sync operates at **scene level**, not whole-manuscript. This limits the blast radius of any conflict to a single scene rather than the entire book.

### Conflict handling
- **Structured fields** (entity traits, relation type, timeline entries): last-write-wins by timestamp — low risk, fields are short and rarely edited on two devices simultaneously.
- **Manuscript prose**: never overwritten silently. If two versions of the same scene are detected without a prior sync, both are preserved (`scene_x_conflict_[timestamp]`) and the writer is notified to review/merge manually. Data loss on prose is treated as the worst-case failure to design against.

### Why not CRDT/OT
This is a solo-writer tool, not real-time multi-user collaboration. The multi-device conflict case (writer switches Mac ↔ Windows without syncing first) is rare and adequately handled by the scene-level LWW + non-destructive-prose approach above. Full CRDT/operational-transform complexity is only justified if real-time multi-author collaboration becomes an actual feature — not assumed for MVP.

## 5. DreamVora handover (bridge, not integration)

Phase 1 (current plan): a **redirect/side-panel bridge**, not a rebuilt DreamVora inside the Hub. DreamVora remains on Gemini Canvas.

**Handover principle:** the URL passes *references*, not *content*.

- URL params: `session` (auth token), `project` (project ID), `entity` (entity ID being worked on, if any), `mode` (the specific DreamVora function to land on, e.g. `create_character`, `react_to_passage`).
- On load, the target DreamVora tool **fetches** full context from the Worker using those references (trimmed/relevant context only — not a full data dump).
- After generation, DreamVora **pushes** results back to the Worker via POST (never through URL).
- The Hub picks up the update by re-fetching from D1 on refocus — large data never travels through browser navigation.

For ad-hoc cases (e.g. "highlight text, ask a character to react to it"), the highlighted snippet itself has no permanent entity ID — it's passed as a short-lived `snippet_id` stored server-side, referenced the same way.

Display mode: side-panel/embedded `<webview>` is the preferred long-term direction over full-page redirect, since it keeps manuscript context visible while DreamVora is used — pending a technical test of how Gemini Canvas renders in a constrained viewport, and how Google auth behaves inside an Electron `<webview>` session.

Phase 2 (future, not MVP): once DreamVora is mature enough to leave Gemini Canvas (BYOK or dedicated backend, matching the ImagesVora precedent), it can become an in-app call from the Hub with no redirect at all.

## 6. Extensibility for future formats (screenplay, stage plays)

Not built now — deferred deliberately, as it requires a distinct editor mode (scene heading / action / character / dialogue / parenthetical nodes, industry pagination rules), not just a config change.

What **is** guaranteed now to avoid a future rewrite:
- `project.format` is an open enum, not a hardcoded set.
- No core schema field assumes prose-only structure (e.g. no `word_count`-only assumption baked into the base `units`/`scenes` table — additional format-specific metrics can be added without migration).
- Entity/Relation/Timeline systems are already format-agnostic and will be reused as-is when screenplay support is eventually built; only the editor layer will differ.

## 7. Licensing note (open question, not yet decided)

If this engine is documented/published for potential future commercialization (SDK/engine licensing), a **source-available custom license** is worth considering over a permissive license like MIT, to preserve the option of controlling commercial reuse. This is a business decision, not a technical one, and is intentionally left open here rather than prescribed.
