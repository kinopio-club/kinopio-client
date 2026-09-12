import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'KeyboardShortcutsHandler.vue'),
  'utf8'
)

describe('paste kinopio items', () => {
  it('drops orphaned connections before createSpaceItems persists them', () => {
    const pasteBlock = source.split('} else if (itemsData) {')[1].split('// add plain text cards')[0]
    const filterAt = pasteBlock.indexOf('utils.removeOrphanedConnections')
    const createAt = pasteBlock.indexOf('spaceStore.createSpaceItems')
    expect(filterAt).toBeGreaterThan(-1)
    expect(createAt).toBeGreaterThan(-1)
    expect(filterAt).toBeLessThan(createAt)
  })

  it('selects pasted lists as well as cards and boxes', () => {
    const pasteBlock = source.split('} else if (itemsData) {')[1].split('// add plain text cards')[0]
    expect(pasteBlock).toContain('addMultipleToMultipleCardsSelected')
    expect(pasteBlock).toContain('addMultipleToMultipleBoxesSelected')
    expect(pasteBlock).toContain('addMultipleToMultipleListsSelected')
  })
})
