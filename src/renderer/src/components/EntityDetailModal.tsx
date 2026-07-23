import { useState, useEffect } from 'preact/hooks'
import type { Entity, Relation } from '@shared/types'

interface EntityDetailModalProps {
  entity: Entity
  projectId: string
  onClose: () => void
  onUpdate: (id: string, data: Partial<Entity>) => void
  onDelete: (id: string) => void
  allEntities: Entity[]
}

export default function EntityDetailModal({ entity, projectId, onClose, onUpdate, onDelete, allEntities }: EntityDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'fields' | 'relations' | 'appearances'>('fields')
  const [name, setName] = useState(entity.name)
  const [coreFields, setCoreFields] = useState<Record<string, any>>(entity.core_fields)
  const [extendedFields, setExtendedFields] = useState<Record<string, any>>(entity.extended_fields)
  const [relations, setRelations] = useState<any[]>([])
  const [appearances, setAppearances] = useState<any[]>([])

  // New relation fields
  const [targetEntityId, setTargetEntityId] = useState('')
  const [relType, setRelType] = useState('')
  const [valence, setValence] = useState(0)
  const [intensity, setIntensity] = useState(50)

  useEffect(() => {
    setName(entity.name)
    setCoreFields(entity.core_fields)
    setExtendedFields(entity.extended_fields)
    loadDetailData()
  }, [entity.id])

  async function loadDetailData() {
    const [rels, apps] = await Promise.all([
      window.hub.relationsByEntity(entity.id),
      window.hub.getAppearances(projectId, entity.id)
    ])
    setRelations(rels || [])
    setAppearances(apps || [])
  }

  const handleSaveFields = () => {
    onUpdate(entity.id, {
      name,
      core_fields: coreFields,
      extended_fields: extendedFields
    })
  }

  const handleAddRelation = async () => {
    if (!targetEntityId || !relType.trim()) return
    await window.hub.createRelation({
      project_id: projectId,
      from_entity_id: entity.id,
      to_entity_id: targetEntityId,
      relation_type: relType.trim(),
      direction: 'directional',
      valence,
      intensity
    })
    setRelType('')
    setTargetEntityId('')
    loadDetailData()
  }

  const handleDeleteRelation = async (relId: string) => {
    await window.hub.deleteRelation(relId)
    loadDetailData()
  }

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div class="ih-header border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
          <input
            class="text-lg font-bold bg-transparent outline-none border-none text-[var(--text-heading)] placeholder-gray-500"
            value={name}
            onInput={(e: any) => setName(e.target.value)}
            onBlur={handleSaveFields}
          />
          <div class="flex gap-2">
            <button 
              onClick={() => {
                if (confirm('Delete this entity?')) {
                  onDelete(entity.id)
                  onClose()
                }
              }} 
              class="px-3 py-1 text-xs text-red-400 hover:text-red-300 font-semibold transition"
            >
              Delete
            </button>
            <button onClick={onClose} class="ih-btn text-xs">Close</button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div class="flex border-b border-[var(--border)] px-6 py-2 bg-[var(--surface-alt)] gap-2">
          {['fields', 'relations', 'appearances'].map((tab: any) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              class={`ih-tab capitalize ${activeTab === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div class="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-[var(--text)]">
          {activeTab === 'fields' && (
            <div class="space-y-4">
              <div>
                <h3 class="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">Core Fields</h3>
                <div class="space-y-3">
                  <div>
                    <label class="text-xs text-[var(--muted)] font-semibold mb-1 block">One Line Trait</label>
                    <input
                      class="ih-input w-full"
                      placeholder="e.g. A cynical warrior searching for her lost sister"
                      value={coreFields.one_line_trait || ''}
                      onInput={(e: any) => {
                        setCoreFields({ ...coreFields, one_line_trait: e.target.value })
                      }}
                      onBlur={handleSaveFields}
                    />
                  </div>
                  <div>
                    <label class="text-xs text-[var(--muted)] font-semibold mb-1 block">Role</label>
                    <input
                      class="ih-input w-full"
                      placeholder="e.g. Protagonist, Antagonist, Mentor"
                      value={coreFields.role || ''}
                      onInput={(e: any) => {
                        setCoreFields({ ...coreFields, role: e.target.value })
                      }}
                      onBlur={handleSaveFields}
                    />
                  </div>
                  <div>
                    <label class="text-xs text-[var(--muted)] font-semibold mb-1 block">Notes</label>
                    <textarea
                      class="ih-input w-full min-h-[80px]"
                      placeholder="Any immediate notes..."
                      value={coreFields.notes || ''}
                      onInput={(e: any) => {
                        setCoreFields({ ...coreFields, notes: e.target.value })
                      }}
                      onBlur={handleSaveFields}
                    />
                  </div>
                </div>
              </div>

              <div class="pt-4 border-t border-[var(--border)]">
                <div class="flex justify-between items-center mb-2">
                  <h3 class="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Extended Fields</h3>
                  <button class="ih-btn text-[10px] px-2 py-0.5 opacity-60 hover:opacity-100">
                    ⚡ Generate with DreamVora
                  </button>
                </div>
                <div class="space-y-3">
                  <div>
                    <label class="text-xs text-[var(--muted)] font-semibold mb-1 block">Backstory</label>
                    <textarea
                      class="ih-input w-full min-h-[80px]"
                      placeholder="Character history or details..."
                      value={extendedFields.backstory || ''}
                      onInput={(e: any) => {
                        setExtendedFields({ ...extendedFields, backstory: e.target.value })
                      }}
                      onBlur={handleSaveFields}
                    />
                  </div>
                  <div>
                    <label class="text-xs text-[var(--muted)] font-semibold mb-1 block">Voice & Dialogue Pattern</label>
                    <input
                      class="ih-input w-full"
                      placeholder="e.g. Speaks fast, uses metaphors, never contracts words"
                      value={extendedFields.voice || ''}
                      onInput={(e: any) => {
                        setExtendedFields({ ...extendedFields, voice: e.target.value })
                      }}
                      onBlur={handleSaveFields}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'relations' && (
            <div class="space-y-6">
              {/* Add relation */}
              <div>
                <h3 class="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">Add Relation</h3>
                <div class="p-4 border border-[var(--border)] rounded-xl bg-[var(--surface-alt)] space-y-3">
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="text-[10px] text-[var(--muted)] uppercase font-bold mb-1 block">Target</label>
                      <select
                        class="ih-input w-full"
                        value={targetEntityId}
                        onChange={(e: any) => setTargetEntityId(e.target.value)}
                      >
                        <option value="">Select target...</option>
                        {allEntities
                          .filter(e => e.id !== entity.id)
                          .map(e => <option key={e.id} value={e.id}>{e.name} ({e.entity_type})</option>)}
                      </select>
                    </div>
                    <div>
                      <label class="text-[10px] text-[var(--muted)] uppercase font-bold mb-1 block">Relation Type</label>
                      <input
                        class="ih-input w-full"
                        placeholder="e.g. Sibling, Rival, Ally"
                        value={relType}
                        onInput={(e: any) => setRelType(e.target.value)}
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="text-[10px] text-[var(--muted)] uppercase font-bold mb-1 block">Valence ({valence})</label>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        class="w-full accent-[var(--accent)]"
                        value={valence}
                        onInput={(e: any) => setValence(parseInt(e.target.value))}
                      />
                      <div class="flex justify-between text-[8px] text-[var(--muted)]">
                        <span>Hostile (-100)</span>
                        <span>Friendly (+100)</span>
                      </div>
                    </div>
                    <div>
                      <label class="text-[10px] text-[var(--muted)] uppercase font-bold mb-1 block">Intensity ({intensity})</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        class="w-full accent-[var(--accent2)]"
                        value={intensity}
                        onInput={(e: any) => setIntensity(parseInt(e.target.value))}
                      />
                      <div class="flex justify-between text-[8px] text-[var(--muted)]">
                        <span>Peripheral</span>
                        <span>Central</span>
                      </div>
                    </div>
                  </div>

                  <button onClick={handleAddRelation} class="ih-btn ih-btn-primary w-full text-xs">Save Relation</button>
                </div>
              </div>

              {/* Relation list */}
              <div>
                <h3 class="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">Active Relations</h3>
                <div class="space-y-2">
                  {relations.map((rel: any) => {
                    const isFrom = rel.from_entity_id === entity.id
                    const targetName = isFrom ? rel.to_name : rel.from_name
                    const targetType = isFrom ? rel.to_type : rel.from_type
                    return (
                      <div key={rel.id} class="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg bg-[var(--surface-alt)]">
                        <div>
                          <div class="font-bold text-sm">{rel.relation_type}</div>
                          <div class="text-xs text-[var(--muted)]">
                            {isFrom ? '→' : '←'} {targetName} ({targetType})
                          </div>
                          <div class="text-[10px] text-[var(--muted2)] mt-1">
                            Valence: <span class={rel.valence < 0 ? 'text-red-400' : 'text-green-400'}>{rel.valence}</span>, 
                            Intensity: <span>{rel.intensity}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteRelation(rel.id)}
                          class="text-red-400 hover:text-red-300 text-xs px-2 py-1 transition"
                        >
                          Remove
                        </button>
                      </div>
                    )
                  })}
                  {relations.length === 0 && (
                    <p class="text-center italic text-xs text-[var(--muted)] py-4">No active relations</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearances' && (
            <div class="space-y-4">
              <h3 class="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Appearances (Backlinks)</h3>
              <p class="text-xs text-[var(--muted2)]">Auto-generated by scanning scene content for @mentions. No manual upkeep required.</p>
              
              <div class="space-y-2">
                {appearances.map((app: any) => (
                  <div key={app.id} class="p-3 border border-[var(--border)] rounded-lg bg-[var(--surface-alt)] font-semibold flex justify-between items-center">
                    <span>🎬 {app.title}</span>
                    <span class="text-[10px] px-2 py-0.5 rounded bg-[var(--border)] text-[var(--accent)] font-mono">MENTIONED</span>
                  </div>
                ))}
                {appearances.length === 0 && (
                  <p class="text-center italic text-xs text-[var(--muted)] py-4">This entity has not been mentioned in any scenes yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
