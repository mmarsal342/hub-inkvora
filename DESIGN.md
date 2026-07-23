# InkVora Hub — Design

## 1. Core layout — three panes

Modeled on Scrivener's Binder/Corkboard/Outliner trio, where all three views stay linked to the same underlying structure.

- **Sidebar (left)** — project tree: parts/chapters/scenes/episodes, drag-reorderable, mirrors `unit.order_key`.
- **Editor (center)** — TipTap, where writing actually happens.
- **Inspector panel (right)** — contextual entity info relevant to whatever is open in the editor (linked characters, locations, relations), sourced from auto-generated backlinks.

An optional **Corkboard/Outline view** (toggle, not default) gives a top-down structural view for reorganizing — most valuable for novel-length projects, least necessary for flash fiction.

## 2. Entity "Room" pattern

One consistent pattern is reused across every entity type (Character, Location, Faction, Item, Lore) rather than a bespoke UI per type:

**Project → Room (per entity type) → Detail page (per entity)**

Each Room is a roster/grid (e.g. Character Room lists all characters in the project). Clicking one opens its detail page, which always contains:

1. **Fields** — core + extended (see SCHEMA.md §3), visibly distinguishing filled vs. empty.
2. **Relations** — current state plus history, e.g. *"Ally with Marcus, enemy of Faction X"* and, if evolved: *"Ch. 1–4: Rival → Ch. 5: Ally, triggered by 'Rescue at the Ruins'."*
3. **Journey/Timeline** — every event this entity participates in, ordered by `story_time` (`sort_key`), not by chapter-written order — this keeps the journey coherent even in non-linear manuscripts.
4. **Appearances** — auto-generated backlinks: every scene that `@mentions` this entity, with no manual upkeep required.

This single page functions as a living profile, and is also the natural landing surface for DreamVora-generated content once unlocked — generation fills the empty fields on the same page, not a separate view.

## 3. Mention system (`@entity`)

- Mentions store the entity's **id**, never its literal name string.
- **Rename-safe:** renaming "Elena" to "Elena Vareth" updates every mention automatically, since the displayed label is rendered live from current entity data — no find-and-replace needed.
- **Link direction:** always from manuscript → entity, never maintained the other way manually. The "Appearances" list on an entity page is a backlink, generated automatically — this avoids the maintenance burden of keeping both directions in sync by hand.
- **Deleted entity, mention remains:** the mention renders as visually distinct (e.g. greyed / dashed underline) rather than silently vanishing; the writer is offered to unlink or reassign it — text itself is never auto-deleted.
- **Re-indexing scope:** on save, only the edited scene is re-scanned for mentions and diffed against the previous index — not the whole manuscript.

## 4. Format templates

One shared config, different defaults — not six separate systems. Format only pre-sets structure depth, unit labeling, and default panel visibility; everything remains editable after project creation.

| Format | Unit structure | Default label | Relations/Timeline panel | Typical length |
|---|---|---|---|---|
| Flash fiction | Flat, single unit | (unlabeled — just "Story") | Collapsed/hidden | <1,000 words |
| Cerpen | Flat, optional scene breaks | "Section" (optional) | Collapsed, accessible | 1,500–7,500 words |
| Cerbung | Flat list, episodic | "Episode" | Visible, lightweight | Variable, small per episode |
| Webnovel | Optional nesting (Arc > Chapter) | "Chapter"/"Bab" | Visible, full | Long-running, ongoing |
| Novel | Nested (Part > Chapter > Scene) | "Chapter"/"Bab" | Visible, full, emphasized | 60,000–120,000 words |
| Custom | Blank, user-defined | User-defined | User-toggled | User-defined |

**Rationale for hiding panels on short forms:** flash fiction and cerpen rarely need relation/timeline tracking (few characters, short span) — hiding these by default avoids overwhelming a writer who just wants to write, while keeping the feature one click away if the project grows in complexity.

**Cerbung/webnovel get relation/timeline visible by default**, unlike novel-length prose written in one continuous sitting, because these are written and published episodically with real gaps between updates — a quick "what was the state between A and B last time" reminder matters more here.

Changing a project's format after creation is a metadata + restructuring operation (e.g. wrapping flat units into a "Part 1" folder), never a data migration — no risk of data loss when a flash fiction piece grows into a novel.

## 5. Unlock / upsell UX

The AI-assisted version of a tool appears as a button **inside the same manual tool's UI** (e.g. a "Generate with DreamVora" button directly on the character sheet form), not as a separate application experience. This keeps the upsell as a natural extension of an existing action rather than a context switch, and avoids "your work is held hostage" framing (see PRD.md §4).

## 6. Conflict resolution UI (concept, implementation detail parked)

When two unsynced versions of the same scene are detected:
- Neither version is silently overwritten.
- The "losing" version is preserved separately, and the writer is notified with a clear choice to review/merge — this only ever happens at scene granularity, never across the whole manuscript.

## 7. DreamVora surface (future)

Preferred direction is a **side-panel embed** (Electron `<webview>`) rather than a full-page redirect, so manuscript context stays visible while using DreamVora — pending a technical spike on Gemini Canvas's behavior in a narrow viewport and Google auth session handling inside a webview (see ARCHITECTURE.md §5).

## 8. Deferred / phase 2+

- **Graph view** of entity relations (Obsidian-style) — the `relation` table already supports this from day one; only the rendering UI is deferred.
- **Screenplay editor mode** — distinct node types (scene heading, action, character, dialogue) required; not built until there is real demand (see ARCHITECTURE.md §6).
