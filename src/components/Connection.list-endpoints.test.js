import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'Connection.vue'),
  'utf8'
)

describe('connection list endpoints', () => {
  it('resolves start and end items through getSpaceItemById so lists are included', () => {
    const block = source.split('const items = computed')[1].split('const isConnectedToCommentCard')[0]
    expect(block).toContain('getSpaceItemById(startItemId)')
    expect(block).toContain('getSpaceItemById(endItemId)')
  })

  it('treats selected lists as connected endpoints, not only cards', () => {
    const block = source.split('const isConnectedToMultipleCardsSelected')[1].split('const isHoveredOverConnectedItem')[0]
    expect(block).toContain('multipleCardsSelectedIds')
    expect(block).toContain('multipleBoxesSelectedIds')
    expect(block).toContain('multipleListsSelectedIds')
    expect(block).toContain('[globalStore.currentDraggingListId]')
  })

  it('highlights a connection when the hovered endpoint is a list', () => {
    const block = source.split('const isHoveredOverConnectedItem')[1].split('const isCurrentItemConnection')[0]
    expect(block).toContain('currentUserIsHoveringOverCardId')
    expect(block).toContain('currentUserIsHoveringOverBoxId')
    expect(block).toContain('currentUserIsHoveringOverListId')
    expect(block).toContain('currentUserIsHoveringOverConnectorItemId')
  })

  it('disables pointer events and animation while a list is being dragged', () => {
    const styles = source.split('const connectionStyles')[1].split('const connectionPathStyles')[0]
    expect(styles).toContain('currentUserIsDraggingList')
    const animate = source.split('const shouldAnimate')[1].split('watch(() => shouldAnimate')[0]
    expect(animate).toContain('currentUserIsDraggingList')
  })
})
