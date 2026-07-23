import { useState, useRef } from 'preact/hooks'
import type { Unit } from '@shared/types'
import { flattenTree, sortByOrderKey, midOrderKey, type FlatNode } from '@shared/orderKey'

interface CorkboardViewProps {
  units: Unit[]
  activeUnitId: string | null
  onSelectUnit: (id: string) => void
  onReorder: (id: string, newOrderKey: string, newParentId: string | null) => Promise<void>
  onBackToEditor: () => void
}

function wordCount(content: string): number {
  try {
    const json = content && content !== '{}' ? JSON.parse(content) : null
    if (!json) return 0
    const text = getPlainText(json)
    return text ? text.trim().split(/\s+/).filter(Boolean).length : 0
  } catch { return 0 }
}

function getPlainText(node: any): string {
  if (!node) return ''
  if (node.text) return node.text
  if (node.content && Array.isArray(node.content)) {
    return node.content.map(getPlainText).join(' ') + ' '
  }
  return ''
}

export default function CorkboardView({ units, activeUnitId, onSelectUnit, onReorder, onBackToEditor }: CorkboardViewProps) {
  const [mode, setMode] = useState<'cards' | 'list'>('cards')
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const dragId = useRef<string | null>(null)

  const flat: FlatNode<Unit>[] = flattenTree(units, sortByOrderKey)
  const flatIdx = new Map(flat.map((f, i) => [f.node.id, { node: f, index: i }]))

  function getSiblingAfter(beforeId: string, parentId: string | null): FlatNode<Unit> | null {
    const entry = flatIdx.get(beforeId)
    if (!entry) return null
    for (let i = entry.index + 1; i < flat.length; i++) {
      const f = flat[i]
      if (f.parentId === parentId) return f
      if (f.depth < entry.node.depth) break
    }
    return null
  }

  async function handleDrop(targetId: string) {
    const draggedId = dragId.current
    if (!draggedId || draggedId === targetId) { setDragOverId(null); return }

    const target = flatIdx.get(targetId)
    if (!target) return

    const newParentId = target.node.parentId
    const rightNode = getSiblingAfter(targetId, newParentId)
    const leftKey = target.node.node.order_key
    const rightKey = rightNode?.node.order_key ?? null
    const newKey = midOrderKey(leftKey, rightKey)

    await onReorder(draggedId, newKey, newParentId)
    dragId.current = null
    setDragOverId(null)
  }

  return (
    <main class="ih-editor-wrap ih-pane">
      {/* Header */}
      <div class="ih-header flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="font-bold tracking-wider text-xs">STRUCTURE</span>
          <span class="text-[10px] text-[var(--muted)] font-mono">{flat.length} units</span>
        </div>

        <div class="flex gap-2 items-center">
          <div class="flex border border-[var(--border)] rounded-md overflow-hidden">
            <button
              onClick={() => setMode('cards')}
              class={`text-[10px] px-3 py-1 font-bold uppercase tracking-wider transition ${
                mode === 'cards' ? 'bg-[var(--accent)] text-[var(--bg)]' : 'text-[var(--muted)] hover:text-[var(--muted2)]'
              }`}
            >Cards</button>
            <button
              onClick={() => setMode('list')}
              class={`text-[10px] px-3 py-1 font-bold uppercase tracking-wider transition ${
                mode === 'list' ? 'bg-[var(--accent)] text-[var(--bg)]' : 'text-[var(--muted)] hover:text-[var(--muted2)]'
              }`}
            >List</button>
          </div>
          <button onClick={onBackToEditor} class="ih-btn text-xs">Back to Editor</button>
        </div>
      </div>

      {/* Content area */}
      <div class="flex-1 overflow-y-auto p-6">
        {mode === 'cards' ? (
          /* ── Corkboard Cards ──────────────────────── */
          <div class="grid grid-cols-3 gap-3">
            {flat.map(({ node, depth }) => (
              <div
                key={node.id}
                class={`cork-card group cursor-pointer ${activeUnitId === node.id ? 'cork-card-active' : ''} ${dragOverId === node.id ? 'cork-card-drag' : ''}`}
                style={`margin-left: ${depth * 1}rem`}
                draggable
                onDragStart={(e: any) => { dragId.current = node.id; e.dataTransfer.effectAllowed = 'move' }}
                onDragOver={(e: any) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                onDragEnter={(e: any) => { e.preventDefault(); setDragOverId(node.id) }}
                onDragLeave={(e: any) => {
                  const rt = e.relatedTarget as Node
                  if (!(e.currentTarget as Node).contains(rt)) setDragOverId(null)
                }}
                onDrop={(e: any) => { e.preventDefault(); e.stopPropagation(); handleDrop(node.id) }}
                onClick={() => onSelectUnit(node.id)}
              >
                {/* Depth indicator bar */}
                {depth > 0 && (
                  <div class="cork-depth-bar" style={`width: ${depth * 12}px`} />
                )}

                <div class="cork-card-header">
                  <span class="cork-card-title">{node.title}</span>
                  <span class="cork-card-count">{wordCount(node.content)}w</span>
                </div>

                {depth > 0 && (
                  <div class="cork-card-depth text-[var(--muted)]">
                    ↳ Level {depth}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* ── Outline List ─────────────────────────── */
          <div class="outline-list">
            <div class="outline-header-row">
              <span class="w-8" />
              <span class="flex-1 font-bold text-[10px] uppercase tracking-wider text-[var(--muted)]">Title</span>
              <span class="w-16 text-right font-bold text-[10px] uppercase tracking-wider text-[var(--muted)]">Words</span>
              <span class="w-20 text-right font-bold text-[10px] uppercase tracking-wider text-[var(--muted)]">Order</span>
            </div>
            {flat.map(({ node, depth }) => (
              <div
                key={node.id}
                class={`outline-row group ${activeUnitId === node.id ? 'outline-row-active' : ''} ${dragOverId === node.id ? 'outline-row-drag' : ''}`}
                style={`padding-left: ${depth * 1.5 + 0.5}rem`}
                draggable
                onDragStart={(e: any) => { dragId.current = node.id; e.dataTransfer.effectAllowed = 'move' }}
                onDragOver={(e: any) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                onDragEnter={(e: any) => { e.preventDefault(); setDragOverId(node.id) }}
                onDragLeave={(e: any) => {
                  const rt = e.relatedTarget as Node
                  if (!(e.currentTarget as Node).contains(rt)) setDragOverId(null)
                }}
                onDrop={(e: any) => { e.preventDefault(); e.stopPropagation(); handleDrop(node.id) }}
                onClick={() => onSelectUnit(node.id)}
              >
                <span class="w-8 text-[var(--muted)] text-xs">{depth > 0 ? '↳' : ''}</span>
                <span class="flex-1 font-semibold text-sm">{node.title}</span>
                <span class="w-16 text-right text-xs text-[var(--muted)]">{wordCount(node.content)}</span>
                <span class="w-20 text-right text-[10px] font-mono text-[var(--muted)]">{node.order_key}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
