import { useState, useEffect } from 'preact/hooks'
import type { Project, Unit, Entity } from '@shared/types'
import './styles/index.css'

// ── Components ──────────────────────────────────────────────────────────────
import Sidebar from './components/Sidebar'
import EditorPane from './components/EditorPane'
import InspectorPane from './components/InspectorPane'
import CorkboardView from './components/CorkboardView'
import { useTheme } from './hooks/useTheme'

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'editor' | 'corkboard'>('editor')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initApp()
  }, [])

  async function initApp() {
    setLoading(true)
    try {
      let loadedProjects = await window.hub.listProjects()
      
      if (loadedProjects.length === 0) {
        const p = await window.hub.createProject({ 
          title: 'Untitled Project', 
          format: 'novel', 
          primary_language: 'id' 
        })
        loadedProjects = [p]
      }
      
      await loadProjectData(loadedProjects[0])
    } catch (err) {
      console.error('initApp failed:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadProjectData(proj: Project) {
    setActiveProject(proj)
    const [loadedUnits, loadedEntities] = await Promise.all([
      window.hub.listUnits(proj.id),
      window.hub.listEntities(proj.id)
    ])

    if (loadedUnits.length === 0) {
      const u = await window.hub.createUnit({ project_id: proj.id, title: 'Chapter 1' })
      setUnits([u])
      setActiveUnitId(u.id)
    } else {
      setUnits(loadedUnits)
      setActiveUnitId(loadedUnits[0].id)
    }

    setEntities(loadedEntities)
  }

  async function refreshUnits() {
    if (!activeProject) return
    const loaded = await window.hub.listUnits(activeProject.id)
    setUnits(loaded)
  }

  if (loading || !activeProject) return <div class="ih-empty-state">Loading InkVora Hub...</div>

  return (
    <>
      <div class="bg-grid" />
      <div class="ih-3pane">
        <Sidebar 
          project={activeProject} 
          units={units} 
          activeUnitId={activeUnitId} 
          onSelectUnit={setActiveUnitId}
          onAddUnit={async () => {
            const u = await window.hub.createUnit({ project_id: activeProject.id, title: 'New Scene' })
            setUnits([...units, u])
            setActiveUnitId(u.id)
          }}
          onAddChildUnit={async (parentId: string) => {
            const u = await window.hub.createUnit({ 
              project_id: activeProject.id, 
              parent_unit_id: parentId, 
              title: 'New Sub-Scene' 
            })
            setUnits([...units, u])
            setActiveUnitId(u.id)
          }}
          onReorder={async (id, newOrderKey, newParentId) => {
            await window.hub.reorderUnit(id, newOrderKey, newParentId)
            await refreshUnits()
          }}
          onDeleteUnit={async (id) => {
            await window.hub.deleteUnit(id)
            setUnits(units.filter(u => u.id !== id && u.parent_unit_id !== id))
            if (activeUnitId === id) {
              const remaining = units.filter(u => u.id !== id)
              setActiveUnitId(remaining[0]?.id || null)
            }
          }}
          onRenameUnit={async (id, title) => {
            const updated = await window.hub.updateUnit(id, { title })
            setUnits(units.map(u => u.id === id ? updated : u))
          }}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSelectProject={loadProjectData}
          viewMode={viewMode}
          onToggleView={() => setViewMode(viewMode === 'editor' ? 'corkboard' : 'editor')}
        />
        {viewMode === 'corkboard' ? (
          <CorkboardView
            units={units}
            activeUnitId={activeUnitId}
            onSelectUnit={(id) => {
              setActiveUnitId(id)
              setViewMode('editor')
            }}
            onReorder={async (id, newOrderKey, newParentId) => {
              await window.hub.reorderUnit(id, newOrderKey, newParentId)
              await refreshUnits()
            }}
            onBackToEditor={() => setViewMode('editor')}
          />
        ) : (
          <EditorPane 
            unit={units.find(u => u.id === activeUnitId) || null} 
            onUpdateUnit={async (id, data) => {
              const updated = await window.hub.updateUnit(id, data)
              setUnits(units.map(u => u.id === id ? updated : u))
            }}
          />
        )}
        <InspectorPane 
          project={activeProject} 
          entities={entities} 
          onAddEntity={async (type, name) => {
            const e = await window.hub.createEntity({ project_id: activeProject.id, entity_type: type, name })
            setEntities([...entities, e])
          }}
          onUpdateEntity={(id, updated) => {
            setEntities(entities.map(e => e.id === id ? updated : e))
          }}
          onDeleteEntity={(id) => {
            setEntities(entities.filter(e => e.id !== id))
          }}
        />
      </div>
    </>
  )
}
