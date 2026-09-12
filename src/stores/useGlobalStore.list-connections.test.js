import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'useGlobalStore.js'),
  'utf8'
)

describe('duplicate-drag connections', () => {
  it('treats lists as connection endpoints along with cards and boxes', () => {
    const block = source.split('const connectableItemIds')[1].split('// current dragging item index')[0]
    expect(block).toContain('cards.concat(boxes, lists)')
  })

  it('tracks hovering over a list like cards and boxes', () => {
    expect(source).toContain('currentUserIsHoveringOverListId')
  })
})

describe('duplicate-drag list membership', () => {
  it('keeps remapped listId when the list was duplicated, and clears it otherwise', () => {
    const block = source.split('const zItemTypes')[1].split('newItems.connections.forEach')[0]
    expect(block).toContain('duplicatedListIds.has(card.listId)')
    expect(block).toContain('card.listId = null')
    expect(block).not.toContain('item.listId = null')
  })
})

describe('restore selection after changing space', () => {
  it('reloads list ids along with cards, boxes, and connections', () => {
    const load = source.split('multipleSelectedItemsToLoad (items)')[1].split('restoreMultipleSelectedItemsToLoad')[0]
    const restore = source.split('restoreMultipleSelectedItemsToLoad ()')[1].split('async clearAllSelected')[0]
    expect(load).toContain('multipleListsSelectedIdsToLoad')
    expect(load).toContain('items.lists')
    expect(restore).toContain('multipleListsSelectedIds = this.multipleListsSelectedIdsToLoad')
    expect(restore).toContain('this.multipleListsSelectedIdsToLoad = []')
  })
})
