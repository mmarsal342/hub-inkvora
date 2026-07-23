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
  const [wordCount, setWordCount] = useState(0)

  useEffect(() => {
    if (!editorRef.current || !unit) return

    editorInst.current = new Editor({
      element: editorRef.current,
      extensions: [
        StarterKit,
        Placeholder.configure({
          placeholder: 'Start writing...'
        })
      ],
      content: unit.content !== '{}' ? JSON.parse(unit.content) : '',
      onUpdate: ({ editor }) => {
        const json = JSON.stringify(editor.getJSON())
        onUpdateUnit(unit.id, { content: json })
        const text = editor.getText()
        setWordCount(text ? text.trim().split(/\s+/).length : 0)
      }
    })

    return () => {
      editorInst.current?.destroy()
      editorInst.current = null
    }
  }, [unit?.id])

  useEffect(() => {
    if (editorInst.current && unit?.content && unit.content !== '{}') {
      try {
        editorInst.current.commands.setContent(JSON.parse(unit.content))
      } catch {}
    }
  }, [unit?.content])

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
          value={unit.title}
          onBlur={(e: any) => onUpdateUnit(unit.id, { title: e.target.value })}
          onChange={(e: any) => onUpdateUnit(unit.id, { title: e.target.value })}
        />
        <span class="text-xs text-gray-500">{wordCount} words</span>
      </div>
      <div class="ih-editor" ref={editorRef} />
    </main>
  )
}
