# InkVora Hub — Data Schema

All tables exist identically in local SQLite and Cloudflare D1 (mirrored schema). Sync metadata columns (`sync_status`, `updated_at`, `device_id`) exist on every syncable table but are omitted below for brevity except where relevant.

## 1. Project

```
project {
  id
  title
  format          // 'novel' | 'cerpen' | 'cerbung' | 'webnovel' | 'flash_fiction' | 'custom'
                   // open enum — new values (e.g. 'screenplay') can be added without migration
  primary_language // content language of the manuscript (not UI language)
  created_at
}
```

Format only sets **defaults** (unit structure, labels, panel visibility — see DESIGN.md §3). Nothing here locks a project into a genre; format can change after creation without data loss, since it's metadata, not a structural constraint.

## 2. Units (manuscript structure)

Generic container for chapters/episodes/scenes — labeling is presentation-layer, not schema-layer.

```
unit {
  id
  project_id
  parent_unit_id   // nullable — supports flat (no nesting) or nested (Part > Chapter > Scene)
  order_key        // fractional index, see §5
  title
  content          // TipTap document (JSON)
}
```

## 3. Entities (universal across all formats)

```
entities {
  id                // system-generated (UUID/ULID), immutable, never derived from name
  entity_type       // 'character' | 'location' | 'faction' | 'item' | 'lore' | 'timeline_event'
  name              // user-editable label, can change freely — mentions reference id, not name
  core_fields       // JSON: minimal required fields (role, one_line_trait, notes)
  extended_fields   // JSON: deep fields (arc stage, voice, backstory, etc.) — optional, filled
                     // manually or via DreamVora unlock
  deleted_at        // nullable — soft delete (tombstone pattern), never hard-deleted directly
  merged_into       // nullable — set when this entity was merged into another (see §6)
}
```

**Tiering principle:** `core_fields` is what a flash-fiction writer fills in five seconds. `extended_fields` is what a novel with CharaVora-level depth eventually populates — either by hand or through DreamVora generation. No field is ever required.

## 4. Project ↔ Entity linkage

```
project_entities {
  project_id
  entity_id
}
```

Deliberately a junction table, not a `project_id` column directly on `entities`. Today the relationship is always 1:1 (one entity belongs to one project). This indirection costs nothing now but avoids a schema migration if a future "shared universe across projects" feature is built — a second row is all that's needed then.

## 5. Relations (entity ↔ entity)

```
relation {
  id
  project_id
  from_entity_id
  to_entity_id
  relation_type     // e.g. "ally", "rival", "member_of", "located_in" — preset by entity-type
                     // pairing, but custom types are allowed
  direction         // 'symmetric' | 'directional'
  valence           // -100 (hostile) ... 0 (neutral) ... +100 (close) — polarity
  intensity         // 0 (peripheral) ... 100 (central/intense) — magnitude, independent of valence
  current_type      // convenience field mirroring the latest state, for fast queries (e.g. ClashVora)
  history           // JSON array of { from_type, to_type, story_time, event_id, note }
}
```

**Multi-relation-type per pair:** a single entity pair can have **multiple rows** simultaneously — e.g. Elena↔Marcus can have one row for `"sibling"` (static, no history) and a separate row for `"rival→ally"` (evolving, has `history`). This is a multigraph, not a single-edge model — it avoids overloading one field with concerns that don't share a lifecycle.

**Valence vs. intensity, why split:** a single "strength" scalar can't distinguish "deeply hostile" (low valence, high intensity) from "mutual indifference" (neutral valence, low intensity) — both would otherwise look like "not close." ClashVora's friction map uses `intensity` for line weight and `valence` for color gradient.

## 6. Entity deletion & merge

- **Soft delete only.** `deleted_at` is set; the entity disappears from active rosters but any relation/mention still pointing to it renders as "🔗 [deleted entity]" rather than breaking. Hard delete only happens after an explicit, separate "delete forever" action (e.g. after a trash retention window).
- **Merge = redirect, not destroy.** Merging entity B into A reassigns every relation/mention/event_participant row from B to A, then sets `B.merged_into = A.id` (B is not deleted). This makes merges reversible and keeps a record that B ever existed.

## 7. Event participants (N-ary relationships)

Events involving many entities at once (e.g. a battle with 5 characters + 2 factions) are **not** forced into the binary `relation` table. A separate junction table handles this:

```
event_participants {
  event_id
  entity_id
  role        // e.g. "combatant", "victim", "witness", "instigator"
}
```

`relation` = entity-to-entity relationships. `event_participants` = who was present at a given event. Two different concerns, two tables — keeps queries like "who is Elena's enemy" and "who was at the Battle of the Ruins" from tangling together.

## 8. Timeline / Events

Supports story time spanning millennia down to seconds, within the same project, without unit conflicts.

```
event {
  id
  project_id
  sort_key        // single sortable numeric value, unit-agnostic — see fractional indexing below
  precision       // 'era' | 'century' | 'decade' | 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'
  display_label   // free text, e.g. "Year 342 of the Ember Era" or "14:32, day of the coup"
  relative_to     // optional: { event_id, relation: 'before' | 'after' | 'same_time' }
}
```

- `sort_key` is a single float/big-number used purely for ordering — it lets a "600 years before the story begins" event and a "14:32 on coup day" event sort correctly against each other without unit collisions.
- `precision` drives display grouping/zoom level in a timeline view.
- `relative_to` supports pantser-style placement ("put this after event X") without committing to an exact number yet — resolved via fractional indexing (see §9), refinable to an exact `sort_key` later.
- Two distinct time concepts must never be conflated: **story_time** (`sort_key`, chronological in-world order) vs. **scene position** (the `order_key` in `unit`, i.e. the order things are written/read). Non-linear narratives (flashbacks, dual timelines) require both to stay separate — a character's "Journey" view sorts by `sort_key`, not by chapter-written order.

## 9. Fractional indexing (used for `order_key` and relative `sort_key` placement)

Standard technique (same pattern as Notion/Trello/Figma drag-reorder): inserting between two items with values 100 and 200 yields 150; inserting again between 100 and 150 yields 125, and so on — new items never require renumbering existing ones.

## 10. Sync metadata (present on every syncable table)

```
sync_status   // 'synced' | 'dirty' | 'conflict'
updated_at    // local last-modified timestamp
device_id     // generated once per install, identifies which device made the change
```

See ARCHITECTURE.md §4 for how these fields drive push/pull and conflict resolution.
