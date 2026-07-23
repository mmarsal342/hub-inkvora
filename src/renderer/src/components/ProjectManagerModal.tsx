import { useState, useEffect } from 'preact/hooks'
import type { Project, ProjectFormat } from '@shared/types'

interface ProjectManagerModalProps {
  currentProject: Project
  onSelectProject: (project: Project) => void
  onClose: () => void
}

const FORMATS: Array<{ key: ProjectFormat; label: string; desc: string }> = [
  { key: 'novel', label: 'Novel', desc: 'Nested parts, chapters & scenes. Best for long books.' },
  { key: 'cerpen', label: 'Cerpen (Short Story)', desc: 'Flat structure, optional dividers. Lightweight.' },
  { key: 'cerbung', label: 'Cerbung (Serialized)', desc: 'Episodic structure, flat list of chapters.' },
  { key: 'webnovel', label: 'Webnovel', desc: 'Nested arcs and episodes. Full panels enabled.' },
  { key: 'flash_fiction', label: 'Flash Fiction', desc: 'Single unit, no structural overhead.' },
  { key: 'custom', label: 'Custom', desc: 'Define your own rules and labels.' }
]

export default function ProjectManagerModal({ currentProject, onSelectProject, onClose }: ProjectManagerModalProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreate, setShowCreate] = useState(false)
  
  // Create fields
  const [title, setTitle] = useState('')
  const [format, setFormat] = useState<ProjectFormat>('novel')
  const [lang, setLang] = useState('id')

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    const list = await window.hub.listProjects()
    setProjects(list || [])
  }

  const handleCreate = async () => {
    if (!title.trim()) return
    const p = await window.hub.createProject({
      title: title.trim(),
      format,
      primary_language: lang
    })
    setTitle('')
    setShowCreate(false)
    loadProjects()
    onSelectProject(p)
  }

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div class="ih-header px-6 py-4 flex items-center justify-between border-b border-[var(--border)]">
          <span class="font-bold text-sm tracking-wider">PROJECT MANAGER</span>
          <button onClick={onClose} class="ih-btn text-xs">Close</button>
        </div>

        {/* Tab switch */}
        <div class="flex border-b border-[var(--border)] px-6 py-2 bg-[var(--surface-alt)] gap-2">
          <button 
            onClick={() => setShowCreate(false)} 
            class={`ih-tab ${!showCreate ? 'active' : ''}`}
          >
            My Projects
          </button>
          <button 
            onClick={() => setShowCreate(true)} 
            class={`ih-tab ${showCreate ? 'active' : ''}`}
          >
            New Project
          </button>
        </div>

        {/* Body */}
        <div class="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {!showCreate ? (
            <div class="space-y-2">
              {projects.map((p) => (
                <div 
                  key={p.id}
                  onClick={() => {
                    onSelectProject(p)
                    onClose()
                  }}
                  class={`p-3 border rounded-lg cursor-pointer transition flex items-center justify-between ${
                    p.id === currentProject.id 
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]' 
                      : 'border-[var(--border)] bg-[var(--surface-alt)] hover:border-[var(--accent2)]'
                  }`}
                >
                  <div>
                    <div class="font-bold text-sm text-[var(--text-heading)]">{p.title}</div>
                    <div class="text-[10px] text-[var(--muted)] mt-1 uppercase font-mono">
                      Format: {p.format} · Lang: {p.primary_language}
                    </div>
                  </div>
                  {p.id === currentProject.id && (
                    <span class="text-[10px] text-[var(--accent)] font-semibold uppercase tracking-wider font-mono">ACTIVE</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div class="space-y-4">
              <div class="space-y-1">
                <label class="text-[10px] text-[var(--muted)] uppercase font-bold">Project Title</label>
                <input
                  class="ih-input w-full"
                  placeholder="e.g. Dunia di Balik Dinding"
                  value={title}
                  onInput={(e: any) => setTitle(e.target.value)}
                />
              </div>

              <div class="space-y-1">
                <label class="text-[10px] text-[var(--muted)] uppercase font-bold">Primary Language</label>
                <select
                  class="ih-input w-full font-semibold"
                  value={lang}
                  onChange={(e: any) => setLang(e.target.value)}
                >
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div class="space-y-1">
                <label class="text-[10px] text-[var(--muted)] uppercase font-bold">Template Format</label>
                <div class="grid grid-cols-2 gap-2 mt-1">
                  {FORMATS.map((f) => (
                    <div
                      key={f.key}
                      onClick={() => setFormat(f.key)}
                      class={`p-2.5 border rounded-lg cursor-pointer transition ${
                        format === f.key 
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)]' 
                          : 'border-[var(--border)] bg-[var(--surface-alt)] hover:border-[var(--muted)]'
                      }`}
                    >
                      <div class="font-bold text-[11px] text-[var(--text-heading)]">{f.label}</div>
                      <div class="text-[9px] text-[var(--muted)] mt-0.5 leading-tight">{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={handleCreate} class="ih-btn ih-btn-primary w-full text-xs py-2">
                Create Project
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
