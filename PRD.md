# InkVora Hub — Product Requirements Document

## 1. Positioning

InkVora Hub is a **free, native, local-first writing application** for fiction writers, built as the retention hub of the VoraLab ecosystem. It is not a competitor to AI writing generators — it is the place where a writer's work lives permanently, structured, and safe.

**Core principle (non-negotiable):** *DreamVora helps generate. InkVora Hub is where the writer writes. The writer always stays in control of the manuscript.*

### Market gap this fills
Existing tools split into two camps:
- **Planner-only, no writing space** (Plottr): strong visual timeline/outline tools, but requires exporting to a separate app to actually write.
- **Writing-only, no AI, desktop-bound** (Scrivener): excellent manuscript organization (Binder/Corkboard/Outliner), but no AI integration, no real-time collaboration, and cloud sync is historically weak.
- **AI-native, cloud-only** (Storyflow, Auctore): strong AI-assisted planning/generation, but not built as a heavy local-first native writing environment.

InkVora Hub's gap: **native, local-first, free, structurally rich (entities/relations/timeline) writing home, with an optional AI layer (DreamVora) bolted on rather than baked in.**

## 2. Target users

- Fiction writers across **all short and long forms**: novel, cerpen (short story), cerbung (serialized short fiction), webnovel, flash fiction, and custom/undefined formats.
- Bilingual from launch: Indonesian and English UI (content language is separate and unconstrained — see SCHEMA.md).
- Writers who may never pay — the free tier must be a complete, non-crippled writing tool on its own.
- Future (not MVP): screenplay/stage play writers — deliberately deferred (see ARCHITECTURE.md §6).

## 3. Business model

Two tiers only — no middle tier.

| Tier | What it includes | Price |
|---|---|---|
| **Free — InkVora Hub** | Manuscript editor, manual entity tools (Character/Location/Faction/Item/Lore/Timeline), relation tracking, project structure, local storage + cloud backup/sync | $0, permanent |
| **Paid — DreamVora unlock** | AI-assisted generation for the same tools (auto-fill character depth, world generation, arc/clash mapping, reactive dialogue suggestions) | Monthly subscription |

**Why subscription, not lifetime:** DreamVora currently runs on top of Gemini Canvas (Google's compute, not ours). A lifetime commitment sold against a dependency we don't control is a business risk if Canvas access, rate limits, or auto-inject behavior changes. Monthly billing keeps pricing adjustable if the underlying delivery mechanism changes (e.g. a future move to BYOK or a dedicated backend).

## 4. Why the free tier must stay fully functional

1. **It is the acquisition engine.** Writers install for free, start writing, and build up characters/world/manuscript data. The more they build, the higher the switching cost to leave — this is the retention moat, not a paywall.
2. **Trust matters more than upsell pressure.** Gating core writing tools behind payment (even manual ones) breaks trust with writers who are emotionally invested in their work. The paywall must sit only in front of *AI assistance*, never in front of *structure or storage*.
3. **Free-to-paid conversion has a natural moment.** Research on unfinished novels consistently points to stories stalling around the 40% mark — not the beginning, not the ending, but the middle. That's the moment DreamVora's upsell ("stuck? let ArchitectVora/ClashVora help remap this") is most credible, not a forced gate at signup.

## 5. Format support (MVP)

Novel, Cerpen, Cerbung, Webnovel, Flash Fiction, Custom. All share one schema; only default structure/labels/panel visibility differ (see DESIGN.md §3). Screenplay/stage play is explicitly out of scope for MVP but the schema must not block adding it later (see ARCHITECTURE.md §6).

## 6. Non-goals for MVP

- Real-time multi-user collaboration (this is a solo-writer tool; sync is for one writer across their own devices, not concurrent co-authors).
- Screenplay/script formatting.
- Graph view visualization of entity relations (nice-to-have, phase 2+ — data model supports it from day one, UI does not need to).
- In-app payment/licensing infrastructure (deferred per earlier StockVora precedent — build the product first).

## 7. Success principles

- DreamVora-generated content must be **noticeably better than what a writer gets from pasting a prompt into a generic chatbot** — consistency with existing characters/world/relations across tools is the actual product, not "access to AI" by itself.
- The Hub must never make a writer feel their work is held hostage. Free means free, permanently, for the writing and organizing tools.
- Any AI-dependent feature that relies on an external platform's uptime/policy (Gemini Canvas) should not be sold as an exclusive premium guarantee without an internal fallback path in mind.
