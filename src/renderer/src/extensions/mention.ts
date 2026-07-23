import Mention from '@tiptap/extension-mention'
import { PluginKey } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/core'

export const mentionPluginKey = new PluginKey('ih-mention')

export function createMentionExtension(onUpdateHasMentions: () => void) {
  return Mention.configure({
    HTMLAttributes: {
      class: 'ih-mention'
    },
    suggestion: {
      char: '@',
      pluginKey: mentionPluginKey,
      items: async ({ query }: { query: string }) => {
        const results = await window.hub.searchEntities(
          (window as any).__ihProjectId || '',
          query
        )
        return results || []
      },
      render: () => {
        let container: HTMLDivElement | null = null
        let items: any[] = []
        let selectedIndex = 0
        let activeProps: any = null

        function updateList() {
          if (!container) return
          if (items.length === 0) {
            container.innerHTML = '<div class="ih-mention-empty">No entities found</div>'
            return
          }
          container.innerHTML = items
            .map((item, i) => {
              const icons: Record<string, string> = {
                character: 'C', location: 'L', faction: 'F', item: 'I', lore: 'W', timeline_event: 'T'
              }
              const icon = icons[item.entity_type] || '?'
              return `<div class="ih-mention-item ${i === selectedIndex ? 'ih-mention-item-active' : ''}" data-index="${i}">
                <span class="ih-mention-icon ih-mention-type-${item.entity_type}">${icon}</span>
                <span class="ih-mention-label">${item.name}</span>
              </div>`
            })
            .join('')

          container.querySelectorAll('.ih-mention-item').forEach((el) => {
            el.addEventListener('click', () => {
              const idx = parseInt(el.getAttribute('data-index') || '0')
              selectItem(idx)
            })
            el.addEventListener('mouseenter', () => {
              const idx = parseInt(el.getAttribute('data-index') || '0')
              selectedIndex = idx
              updateList()
            })
          })
        }

        function selectItem(index: number) {
          const item = items[index]
          if (!item || !activeProps) return
          activeProps.command({ id: item.id, label: item.name })
          onUpdateHasMentions()
          close()
        }

        function close() {
          if (container) {
            container.remove()
            container = null
          }
          activeProps = null
        }

        return {
          onStart: (props: any) => {
            activeProps = props
            items = props.items || []
            selectedIndex = 0

            container = document.createElement('div')
            container.className = 'ih-mention-dropdown'

            const rect = props.clientRect()
            if (rect) {
              container.style.top = `${rect.bottom + 4}px`
              container.style.left = `${rect.left}px`
            }

            document.body.appendChild(container)
            updateList()
          },
          onUpdate: (props: any) => {
            activeProps = props
            items = props.items || []
            selectedIndex = 0

            const rect = props.clientRect()
            if (rect && container) {
              container.style.top = `${rect.bottom + 4}px`
              container.style.left = `${rect.left}px`
            }
            updateList()
          },
          onKeyDown: (props: any) => {
            if (props.event.key === 'ArrowDown') {
              selectedIndex = (selectedIndex + 1) % Math.max(items.length, 1)
              updateList()
              return true
            }
            if (props.event.key === 'ArrowUp') {
              selectedIndex = selectedIndex - 1 < 0 ? Math.max(items.length - 1, 0) : selectedIndex - 1
              updateList()
              return true
            }
            if (props.event.key === 'Enter') {
              selectItem(selectedIndex)
              return true
            }
            if (props.event.key === 'Escape') {
              close()
              return true
            }
            return false
          },
          onExit: () => {
            close()
          }
        }
      }
    }
  })
}
