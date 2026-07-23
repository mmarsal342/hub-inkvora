import { useRef, useEffect, useState } from 'preact/hooks'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import type { Unit } from '@shared/types'

interface EditorPaneProps {
  unit: Unit | null
  onUpdateUnit: (id: string, data: Partial<{ title: string; content: string }>) => void
}

export default function EditorPane({ unit, onUpdateUnit }: EditorPaneProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const editorInst = useRef<Editor | null>(null)
  const unitIdRef = useRef<string | null>(null)
  const onUpdateRef = useRef(onUpdateUnit)
  const [wordCount, setWordCount] = useState(0)
  const [titleValue, setTitleValue] = useState(unit?.title ?? '')

  onUpdateRef.current = onUpdateUnit

  useEffect(() => {
    setTitleValue(unit?.title ?? '')
  }, [unit?.id])

  useEffect(() => {
    if (!editorRef.current || !unit) return
    if (unitIdRef.current === unit.id) return // same unit, skip

    // Destroy previous instance
    editorInst.current?.destroy()
    unitIdRef.current = unit.id

    let initialContent: any = ''
    try {
      initialContent = unit.content && unit.content !== '{}' ? JSON.parse(unit.content) : ''
    } catch {}

    editorInst.current = new Editor({
      element: editorRef.current,
      extensions: [
        StarterKit,
        Placeholder.configure({ placeholder: 'Start writing...' })
      ],
      content: initialContent,
      onUpdate: ({ editor }) => {
        const json = JSON.stringify(editor.getJSON())
        const text = editor.getText()
        setWordCount(text ? text.trim().split(/\\s+/).filter(Boolean).length : 0)
        
        // Debounce update to prevent SQLite BUSY locks
        clearTimeout((window as any)._updateTimer)
        ;(window as any)._updateTimer = setTimeout(() => {
          if (unitIdRef.current) {
            onUpdateRef.current(unitIdRef.current, { content: json })
          }
        }, 800)
      }
    })

    return () => {
      editorInst.current?.destroy()
      editorInst.current = null
      unitIdRef.current = null
    }
  }, [unit?.id])

  if (!unit) {
    return (
      <main class="ih-editor-wrap ih-pane">
        <div class="ih-empty-state">
          <p class="text-xl mb-2">No scene selected</p>
          <p class="text-sm text-gray-500">Select a scene from the sidebar or create a new one.</p>
        </div>
      </main>
    )
  }

  return (
    <main class="ih-editor-wrap ih-pane">
      <div class="ih-header">
        <input
          class="flex-1 bg-transparent outline-none border-none font-medium text-base text-white/90 placeholder-gray-600"
          value={titleValue}
          onInput={(e: any) => setTitleValue(e.target.value)}
          onBlur={() => onUpdateUnit(unit.id, { title: titleValue })}
        />
        <span class="text-xs text-gray-500">{wordCount} words</span>
      </div>
      <div class="ih-editor" ref={editorRef} />
    </main>
  )
}
