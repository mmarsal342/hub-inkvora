import { useState, useEffect } from 'preact/hooks'
import type { Project, Unit, Entity } from '@shared/types'
import './styles/index.css'

// ── Components ──────────────────────────────────────────────────────────────
import Sidebar from './components/Sidebar'
import EditorPane from './components/EditorPane'
import InspectorPane from './components/InspectorPane'

export default function App() {
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initApp()
  }, [])

  async function initApp() {
    setLoading(true)
    try {
      let projects = await window.hub.listProjects()
      
      // Auto-create a default project if none exists (for MVP flow)
      if (projects.length === 0) {
        const p = await window.hub.createProject({ 
          title: 'Untitled Project', 
          format: 'novel', 
          primary_language: 'id' 
        })
        projects = [p]
      }
      
      const proj = projects[0]
      setActiveProject(proj)
      
      const [loadedUnits, loadedEntities] = await Promise.all([
        window.hub.listUnits(proj.id),
        window.hub.listEntities(proj.id)
      ])
      
      // Auto-create a first scene if empty
      if (loadedUnits.length === 0) {
        const u = await window.hub.createUnit({ project_id: proj.id, title: 'Chapter 1' })
        setUnits([u])
        setActiveUnitId(u.id)
      } else {
        setUnits(loadedUnits)
        setActiveUnitId(loadedUnits[0].id)
      }
      
      setEntities(loadedEntities)
    } catch (err) {
      console.error('initApp failed:', err)
    } finally {
      setLoading(false)
    }
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
        />
        <EditorPane 
          unit={units.find(u => u.id === activeUnitId) || null} 
          onUpdateUnit={async (id, data) => {
            const updated = await window.hub.updateUnit(id, data)
            setUnits(units.map(u => u.id === id ? updated : u))
          }}
        />
        <InspectorPane 
          project={activeProject} 
          entities={entities} 
          onAddEntity={async (type, name) => {
            const e = await window.hub.createEntity({ project_id: activeProject.id, entity_type: type, name })
            setEntities([...entities, e])
          }}
        />
      </div>
    </>
  )
}
