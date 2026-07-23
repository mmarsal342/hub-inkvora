import { useState } from 'preact/hooks'
import type { Project, Entity } from '@shared/types'

interface InspectorPaneProps {
  project: Project
  entities: Entity[]
  onAddEntity: (type: string, name: string) => void
}

const ENTITY_TYPES = [
  { key: 'character', label: 'Character', icon: '🧑' },
  { key: 'location', label: 'Location', icon: '📍' },
  { key: 'faction', label: 'Faction', icon: '⚑' },
  { key: 'item', label: 'Item', icon: '📦' },
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
        <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Entities</span>
        <button class="ih-btn text-xs" onClick={() => setShowAdd(!showAdd)}>{showAdd ? '−' : '+'}</button>
      </div>

      {/* Filter tabs */}
      <div class="flex flex-wrap gap-1 px-3 py-2 border-b border-gray-800/60 overflow-x-auto">
        <button
          class={`text-xs px-2 py-1 rounded transition ${filterType === null ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setFilterType(null)}
        >All ({entities.length})</button>
        {grouped.map(t => (
          <button
            key={t.key}
            class={`text-xs px-2 py-1 rounded transition ${filterType === t.key ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setFilterType(t.key)}
          >{t.icon} {t.count}</button>
        ))}
      </div>

      {/* Add form inline */}
      {showAdd && (
        <div class="px-3 py-2 border-b border-gray-800/60">
          <select
            class="w-full bg-gray-900 border border-gray-800 text-white text-xs px-2 py-1 rounded mb-1"
            value={newType}
            onChange={(e: any) => setNewType(e.target.value)}
          >
            {ENTITY_TYPES.map(t => <option value={t.key}>{t.icon} {t.label}</option>)}
          </select>
          <input
            class="w-full bg-gray-900 border border-gray-800 text-white text-xs px-2 py-1 rounded mb-1 placeholder-gray-600"
            placeholder="Entity name"
            value={newName}
            onInput={(e: any) => setNewName(e.target.value)}
            onKeyDown={(e: any) => e.key === 'Enter' && handleAdd()}
          />
          <button class="ih-btn-primary ih-btn text-xs" onClick={handleAdd}>Create</button>
        </div>
      )}

      {/* Entity list */}
      <div class="p-3 space-y-2 text-xs">
        {filtered.map(entity => (
          <div key={entity.id} class="p-2 border border-gray-800/60 rounded bg-gray-900/50 hover:border-indigo-500/40 transition cursor-default">
            <div class="flex items-center justify-between">
              <span class="font-medium text-white text-sm">
                {ENTITY_TYPES.find(t => t.key === entity.entity_type)?.icon} {entity.name}
              </span>
              <span class="text-[10px] uppercase text-gray-600 px-1.5 py-0.5 bg-gray-800 rounded">
                {entity.entity_type}
              </span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p class="text-gray-600 text-center py-4">No entities yet. Click + to create one.</p>
        )}
      </div>
    </aside>
  )
}
