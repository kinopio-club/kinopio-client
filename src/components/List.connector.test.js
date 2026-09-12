import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'List.vue'),
  'utf8'
)

describe('list connector button', () => {
  it('renders ItemConnectorButton for the list itself', () => {
    expect(source).toContain('ItemConnectorButton')
    expect(source).toContain(':list="props.list"')
    expect(source).toContain('currentConnectionStartItemIds.includes(props.list.id)')
  })

  it('records hover so list-to-list connections can highlight', () => {
    const block = source.split('const updateIsHover')[1].split('const startListInfoInteraction')[0]
    expect(block).toContain('currentUserIsHoveringOverListId')
  })

  it('does not start a list drag when the connector is clicked', () => {
    const block = source.split('const startListInfoInteraction')[1].split('const endListInfoInteraction')[0]
    expect(block).toContain("event.target.closest('.connector')")
  })

  it('cmd-drag skips list details like boxes, instead of opening them', () => {
    const block = source.split('const endListInfoInteraction')[1].split('// Remote')[0]
    expect(block).toContain('event.metaKey || event.ctrlKey')
    expect(block).toContain('shouldCancelNextMouseUpInteraction = true')
    expect(block).toContain('currentUserIsDraggingDuplicateItem')
    expect(block).toContain('if (isMeta) { return }')
  })

  it('pulls in lists of already-selected cards when a list drag starts, like cards and boxes', () => {
    const block = source.split('const startListInfoInteraction')[1].split('const endListInfoInteraction')[0]
    expect(block).toContain('selectListsFromMultipleSelectedItems')
  })

  it('does not open list details while completing a connection onto the list', () => {
    const block = source.split('const endListInfoInteraction')[1].split('// Remote')[0]
    expect(block).toContain('if (isConnectingTo.value) { return }')
    expect(block).toContain('currentUserIsDraggingList = false')
    expect(block).toContain('listsWereDragged = false')
  })
})
