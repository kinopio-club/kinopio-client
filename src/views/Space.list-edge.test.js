import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'Space.vue'),
  'utf8'
)

describe('lists dragged to the page edge', () => {
  it('clears the same id list it reads, and does not assign forEach', () => {
    const block = source.split('const checkIfShouldUpdateCardPositionsInEdgeLists')[1].split('// drag items')[0]
    expect(block).toContain('uniq(globalStore.multipleListIdsWereDraggedToEdge)')
    expect(block).toContain('globalStore.multipleListIdsWereDraggedToEdge = []')
    expect(block).not.toContain('multipleListsWereDraggedToEdge')
    expect(block).not.toContain('listIds = listIds.forEach')
    expect(block).toContain('cardStore.updateCardPositionsInList')
  })
})

describe('stop dragging details flags', () => {
  it('clears the line flag with the card, box, and list flags', () => {
    const block = source.split('globalStore.shouldAddCard = false')[1].split('stopResizingCards')[0]
    expect(block).toContain('preventDraggedCardFromShowingDetails = false')
    expect(block).toContain('preventDraggedBoxFromShowingDetails = false')
    expect(block).toContain('preventDraggedListFromShowingDetails = false')
    expect(block).toContain('preventDraggedLineFromShowingDetails = false')
  })
})

describe('dragging a list', () => {
  it('selects the dragged list like a dragged box, so its connections stay active', () => {
    const boxBlock = source.split('const dragBoxes')[1].split('const dragLists')[0]
    const listBlock = source.split('const dragLists')[1].split('// footer')[0]
    expect(boxBlock).toContain('multipleBoxesSelectedIds.push(globalStore.currentDraggingBoxId)')
    expect(listBlock).toContain('selectItemsInSelectedLists')
    expect(listBlock).toContain('multipleListsSelectedIds.push(globalStore.currentDraggingListId)')
    expect(listBlock).toContain('event.metaKey || event.ctrlKey')
    expect(listBlock).toContain('preventSelectItemsInside')
    expect(listBlock).toContain('currentUserIsDraggingDuplicateItem')
  })
})
