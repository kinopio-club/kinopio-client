import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'KeyboardShortcutsHandler.vue'),
  'utf8'
)

describe('B surrounds mixed selections', () => {
  it('triggers surround when lists or boxes are selected, not only cards', () => {
    const block = source.split('} else if (keyB && isSpaceScope)')[1].split('// l')[0]
    expect(block).toContain('multipleCardsSelectedIds.length')
    expect(block).toContain('multipleBoxesSelectedIds.length')
    expect(block).toContain('multipleListsSelectedIds.length')
    expect(block).toContain('triggerSelectedCardsContainInBox')
  })
})
