import { useState } from 'preact/hooks'
import type { Project, Entity } from '@shared/types'

interface InspectorPaneProps {
  project: Project
  entities: Entity[]
  onAddEntity: (type: string, name: string) => void
}

const ENTITY_TYPES = [
  { key: 'character', label: 'Characters', icon: '🧑' },
  { key: 'location', label: 'Locations', icon: '📍' },
  { key: 'faction', label: 'Factions', icon: '⚑' },
  { key: 'item', label: 'Items', icon: '📦' },
  { key: 'lore', label: 'Lore', icon: '📜' },
  { key: 'timeline_event', label: 'Timeline', icon: '⏳' },
]

export default function InspectorPane({ project, entities, onAddEntity }: InspectorPaneProps) {
  const [filterType, setFilterType] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('character')

  const filtered = filterType
    ? entities.filter(e => e.entity_type === filterType)
    : entities

  const handleAdd = () => {
    if (!newName.trim()) return
    onAddEntity(newType, newName.trim())
    setNewName('')
    setShowAdd(false)
  }

  const grouped = ENTITY_TYPES.map(t => ({
    ...t,
    count: entities.filter(e => e.entity_type === t.key).length
  }))

  return (
    <aside class="ih-pane ih-inspector">
      <div class="ih-header">
        <span class="font-bold tracking-wider text-xs">ENTITIES</span>
        <button class="ih-btn text-xs" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '−' : '+'}
        </button>
      </div>

      {/* Filter tabs */}
      <div class="flex flex-wrap gap-1 px-3 py-2.5 border-b border-[var(--border)] overflow-x-auto">
        <button
          class={`text-[10px] px-2.5 py-1 rounded-md transition font-semibold tracking-wider ${filterType === null ? 'bg-[var(--border)] text-[var(--accent)]' : 'text-[var(--muted)] hover:text-[var(--muted2)]'}`}
          onClick={() => setFilterType(null)}
        >ALL·{entities.length}</button>
        {grouped.map(t => (
          <button
            key={t.key}
            class={`text-[10px] px-2.5 py-1 rounded-md transition font-semibold tracking-wider ${filterType === t.key ? 'bg-[var(--border)] text-[var(--accent)]' : 'text-[var(--muted)] hover:text-[var(--muted2)]'}`}
            onClick={() => setFilterType(t.key)}
          >{t.icon}·{t.count}</button>
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        <div class="px-3 py-3 border-b border-[var(--border)]">
          <select
            class="w-full bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] text-xs px-2.5 py-1.5 rounded-md mb-2 font-semibold"
            value={newType}
            onChange={(e: any) => setNewType(e.target.value)}
          >
            {ENTITY_TYPES.map(t => <option value={t.key}>{t.icon} {t.label}</option>)}
          </select>
          <input
            class="w-full bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] text-xs px-2.5 py-1.5 rounded-md mb-2 placeholder-[var(--muted)] outline-none"
            placeholder="Entity name..."
            value={newName}
            onInput={(e: any) => setNewName(e.target.value)}
            onKeyDown={(e: any) => e.key === 'Enter' && handleAdd()}
            autofocus
          />
          <button class="ih-btn ih-btn-primary w-full text-xs" onClick={handleAdd}>Create</button>
        </div>
      )}

      {/* Entity list */}
      <div class="p-3 space-y-2 text-xs">
        {filtered.map(entity => (
          <div key={entity.id} class="ih-entity-card">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-sm text-[var(--text)]">
                {ENTITY_TYPES.find(t => t.key === entity.entity_type)?.icon} {entity.name}
              </span>
              <span class="text-[10px] uppercase text-[var(--muted)] font-mono tracking-wider">
                {entity.entity_type.replace('_', ' ')}
              </span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p class="text-[var(--muted)] text-center py-4 italic text-xs">No entities yet</p>
        )}
      </div>
    </aside>
  )
}
