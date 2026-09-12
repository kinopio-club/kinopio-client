import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'AlignAndDistribute.vue'),
  'utf8'
)

describe('align connection paths', () => {
  it('includes selected lists, not only cards and boxes', () => {
    const block = source.split('const updateConnectionPaths')[1].split('// get element dimensions')[0]
    expect(block).toContain('multipleCardsSelectedIds')
    expect(block).toContain('multipleBoxesSelectedIds')
    expect(block).toContain('multipleListsSelectedIds')
  })
})
