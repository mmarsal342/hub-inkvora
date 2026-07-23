import type { Project, Unit } from '@shared/types'

interface SidebarProps {
  project: Project
  units: Unit[]
  activeUnitId: string | null
  onSelectUnit: (id: string) => void
  onAddUnit: () => void
}

export default function Sidebar({ project, units, activeUnitId, onSelectUnit, onAddUnit }: SidebarProps) {
  return (
    <aside class="ih-pane ih-sidebar flex flex-col justify-between">
      <div>
        <div class="ih-header border-b border-gray-800 p-4">
          <span class="font-bold text-white tracking-wide">{project.title}</span>
          <span class="text-xs px-2 py-0.5 bg-indigo-900/60 rounded text-indigo-200 uppercase">{project.format}</span>
        </div>
        
        <div class="mt-4">
          <div class="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Manuscript</div>
          <div class="space-y-1">
            {units.map((unit) => (
              <div
                key={unit.id}
                class={`ih-tree-item py-2 px-3 mx-2 rounded cursor-pointer transition ${
                  activeUnitId === unit.id 
                    ? 'bg-indigo-600 text-white font-medium' 
                    : 'text-gray-400 hover:bg-gray-800/40 hover:text-white'
                }`}
                onClick={() => onSelectUnit(unit.id)}
              >
                {unit.title}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div class="p-4 border-t border-gray-800/60">
        <button 
          onClick={onAddUnit} 
          class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded text-sm transition"
        >
          + Add New Scene
        </button>
      </div>
    </aside>
  )
}
