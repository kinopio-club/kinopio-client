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

describe('delete selected lists', () => {
  it('lets open-space editors remove lists they created, like boxes', () => {
    const helper = source.split('const canEditList = (list) =>')[1].split('const remove = () =>')[0]
    expect(helper).toContain('getUserCanEditSpace')
    expect(helper).toContain('getItemIsCreatedByUser(list)')
    const remove = source.split('lists.forEach(list =>')[1].split('clearAllSelectedCards')[0]
    expect(remove).toContain('canEditList(list)')
    expect(remove).not.toContain('getUserIsSpaceMember')
  })
})
