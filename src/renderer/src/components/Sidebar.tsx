import type { Project, Unit } from '@shared/types'

interface SidebarProps {
  project: Project
  units: Unit[]
  activeUnitId: string | null
  onSelectUnit: (id: string) => void
  onAddUnit: () => void
  theme: string
  onToggleTheme: () => void
}

export default function Sidebar({ project, units, activeUnitId, onSelectUnit, onAddUnit, theme, onToggleTheme }: SidebarProps) {
  return (
    <aside class="ih-pane ih-sidebar flex flex-col justify-between">
      <div>
        <div class="ih-header">
          <div class="ih-logo">InkVora <span>Hub</span></div>
          <span class="text-[10px] px-2 py-0.5 rounded bg-[var(--border)] text-[var(--accent)] uppercase tracking-wider font-mono">{project.format}</span>
        </div>
        
        <div class="ih-section-title">Manuscript</div>
        <div class="space-y-[1px]">
          {units.map((unit) => (
            <div
              key={unit.id}
              class={`ih-tree-item ${activeUnitId === unit.id ? 'active' : ''}`}
              onClick={() => onSelectUnit(unit.id)}
            >
              {unit.title}
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
  )
}
