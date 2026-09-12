import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'MoveOrCopyItems.vue'),
  'utf8'
)

describe('move selected items to another space', () => {
  it('removes lists from the source space after a move, matching cards and boxes', () => {
    const moveBlock = source.split('await copyToSelectedSpace(items)')[1].split('userStore.updateUserCardsCreatedCount')[0]
    expect(moveBlock).toContain('removeCards(items.cards)')
    expect(moveBlock).toContain('removeBoxes(items.boxes)')
    expect(moveBlock).toContain('removeLists(items.lists)')
    expect(source).toContain('listStore.removeLists')
  })

  it('includes list names when copying a selection to the clipboard or note', () => {
    const textBlock = source.split('const text = computed')[1].split('// labels')[0]
    expect(textBlock).toContain('selected.lists')
    expect(textBlock).toContain('selected.boxes')
  })
})
