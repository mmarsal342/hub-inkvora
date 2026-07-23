import { useState, useRef } from 'preact/hooks'
import type { Project, Unit } from '@shared/types'
import { flattenTree, sortByOrderKey, midOrderKey, type FlatNode } from '@shared/orderKey'
import ProjectManagerModal from './ProjectManagerModal'

interface SidebarProps {
  project: Project
  units: Unit[]
  activeUnitId: string | null
  onSelectUnit: (id: string) => void
  onAddUnit: () => void
  onAddChildUnit: (parentId: string) => void
  onReorder: (id: string, newOrderKey: string, newParentId: string | null) => Promise<void>
  onDeleteUnit: (id: string) => void
  onRenameUnit: (id: string, title: string) => void
  onSelectProject: (project: Project) => void
  theme: string
  onToggleTheme: () => void
}

export default function Sidebar({
  project, units, activeUnitId, onSelectUnit,
  onAddUnit, onAddChildUnit, onReorder, onDeleteUnit, onRenameUnit,
  onSelectProject, theme, onToggleTheme
}: SidebarProps) {
  const [showProjectManager, setShowProjectManager] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const dragId = useRef<string | null>(null)

  const flat: FlatNode<Unit>[] = flattenTree(units, sortByOrderKey)
  const flatIdx = new Map(flat.map((f, i) => [f.node.id, { node: f, index: i }]))

  function getSiblingBefore(afterId: string, parentId: string | null): FlatNode<Unit> | null {
    const entry = flatIdx.get(afterId)
    if (!entry) return null
    for (let i = entry.index - 1; i >= 0; i--) {
      const f = flat[i]
      if (f.parentId === parentId) return f
      if (f.parentId !== parentId && f.depth <= entry.node.depth) break
    }
    return null
  }

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

  function handleDrop(targetId: string, asChild: boolean) {
    const draggedId = dragId.current
    if (!draggedId || draggedId === targetId) {
      setDragOverId(null)
      return
    }

    const target = flatIdx.get(targetId)
    if (!target) return

    let newParentId: string | null
    let leftNode: FlatNode<Unit> | null
    let rightNode: FlatNode<Unit> | null

    if (asChild) {
      newParentId = targetId
      const children = flat.filter(f => f.parentId === targetId)
      rightNode = children.length ? children[0] : null
      leftNode = null
    } else {
      newParentId = target.node.parentId
      leftNode = target.node
      rightNode = getSiblingAfter(targetId, newParentId)
    }

    const leftKey = leftNode?.node.order_key ?? null
    const rightKey = rightNode?.node.order_key ?? null
    const newKey = midOrderKey(leftKey, rightKey)

    onReorder(draggedId, newKey, newParentId)
    dragId.current = null
    setDragOverId(null)
  }

  function startRename(unit: Unit) {
    setRenamingId(unit.id)
    setRenameValue(unit.title)
  }

  function commitRename() {
    if (renamingId && renameValue.trim()) {
      onRenameUnit(renamingId, renameValue.trim())
    }
    setRenamingId(null)
  }

  return (
    <>
      <aside class="ih-pane ih-sidebar flex flex-col justify-between">
        <div>
          {/* Header */}
          <div
            class="ih-header cursor-pointer hover:bg-[var(--accent-soft)] transition"
            onClick={() => setShowProjectManager(true)}
          >
            <div class="flex items-center gap-2">
              <div class="ih-logo">InkVora <span>Hub</span></div>
              <span class="text-[8px] opacity-50">▼</span>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded bg-[var(--border)] text-[var(--accent)] uppercase tracking-wider font-mono">{project.format}</span>
          </div>

          <div class="ih-section-title flex items-center justify-between pr-3">
            <span>Manuscript</span>
          </div>

          {/* Tree */}
          <div class="pb-2">
            {flat.map(({ node, depth, parentId }) => (
              <div
                key={node.id}
                class="ih-tree-row group"
                style={`padding-left: ${0.5 + depth * 1.2}rem`}
              >
                <div
                  class={`ih-tree-item flex items-center gap-1 ${activeUnitId === node.id ? 'active' : ''} ${dragOverId === node.id ? 'drag-over' : ''}`}
                  draggable
                  onDragStart={(e: any) => { dragId.current = node.id; e.dataTransfer.effectAllowed = 'move' }}
                  onDragOver={(e: any) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                  onDragEnter={(e: any) => { e.preventDefault(); setDragOverId(node.id) }}
                  onDragLeave={(e: any) => {
                    const rt = e.relatedTarget as Node
                    if (!(e.currentTarget as Node).contains(rt)) setDragOverId(null)
                  }}
                  onDrop={(e: any) => {
                    e.preventDefault()
                    e.stopPropagation()
                    // Drop as sibling if holding shift, else as child
                    handleDrop(node.id, !e.shiftKey)
                  }}
                  onClick={() => onSelectUnit(node.id)}
                  onDblClick={(e: any) => { e.stopPropagation(); startRename(node) }}
                >
                  {depth > 0 && <span class="ih-tree-branch">↳</span>}
                  {renamingId === node.id ? (
                    <input
                      class="ih-tree-rename-input"
                      value={renameValue}
                      autoFocus
                      onInput={(e: any) => setRenameValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e: any) => {
                        if (e.key === 'Enter') commitRename()
                        if (e.key === 'Escape') setRenamingId(null)
                      }}
                      onClick={(e: any) => e.stopPropagation()}
                    />
                  ) : (
                    <span class="flex-1 truncate">{node.title}</span>
                  )}
                </div>

                {/* Row actions */}
                {activeUnitId === node.id && renamingId !== node.id && (
                  <div class="ih-tree-actions opacity-0 group-hover:opacity-100">
                    <button
                      class="ih-tree-action-btn"
                      title="Add sub-item"
                      onClick={(e: any) => { e.stopPropagation(); onAddChildUnit(node.id) }}
                    >+</button>
                    <button
                      class="ih-tree-action-btn ih-tree-action-danger"
                      title="Delete"
                      onClick={(e: any) => {
                        e.stopPropagation()
                        if (confirm(`Delete "${node.title}"?`)) onDeleteUnit(node.id)
                      }}
                    >×</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div class="p-4 border-t border-[var(--border)] space-y-2">
          <button onClick={onAddUnit} class="ih-btn ih-btn-primary w-full text-xs py-2">
            + New Scene
          </button>
          <button onClick={onToggleTheme} class="ih-theme-btn w-full justify-center text-xs">
            {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
        </div>
      </aside>

      {showProjectManager && (
        <ProjectManagerModal
          currentProject={project}
          onSelectProject={onSelectProject}
          onClose={() => setShowProjectManager(false)}
        />
      )}
    </>
  )
}
