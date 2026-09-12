import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'ItemConnectorButton.vue'),
  'utf8'
)

describe('connector button multi-select', () => {
  it('starts a connection from selected lists as well as cards and boxes', () => {
    const block = source.split('const createCurrentConnection')[1].split('// connector button')[0]
    expect(block).toContain('multipleCardsSelectedIds')
    expect(block).toContain('multipleBoxesSelectedIds')
    expect(block).toContain('multipleListsSelectedIds')
  })

  it('treats a list prop as the connectable item', () => {
    expect(source).toContain('list: Object')
    const itemLine = source.split('const item = computed')[1].split('\n')[0]
    expect(itemLine).toContain('props.list')
    expect(source).toContain('preventDraggedListFromShowingDetails')
  })

  it('colors the connector when a connected list is hovered, selected, dragged, or opened', () => {
    const hover = source.split('const currentUserIsHoveringOverConnectedItemColor')[1].split('const currentUserIsMultipleSelectedItemColor')[0]
    expect(hover).toContain('currentUserIsHoveringOverListId')
    const selected = source.split('const currentUserIsMultipleSelectedItemColor')[1].split('const currentUserIsCreatingConnectionColor')[0]
    expect(selected).toContain('multipleListsSelectedIds')
    const dragged = source.split('const connectedToAnotherItemBeingDraggedColor')[1].split('const connectedToConnectionDetailsIsVisibleColor')[0]
    expect(dragged).toContain('currentUserIsDraggingList')
    expect(dragged).toContain('currentDraggingListId')
    const details = source.split('const connectedToAnotherItemDetailsVisibleColor')[1].split('const connectedToAnotherItemBeingDraggedColor')[0]
    expect(details).toContain('listDetailsIsVisibleForListId')
  })

  it('keeps connector glow available while a connected list is dragged', () => {
    const glow = source.split('const connectorGlowStyle')[1].split('const connectionColor')[0]
    expect(glow).not.toContain('currentUserIsDraggingList')
    expect(glow).toContain('connectedToAnotherItemBeingDraggedColor')
  })
})
