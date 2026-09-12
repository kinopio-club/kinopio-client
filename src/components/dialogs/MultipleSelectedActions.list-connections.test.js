import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'MultipleSelectedActions.vue'),
  'utf8'
)

describe('multiple selected connection actions', () => {
  it('includes lists when connecting or disconnecting a mixed selection', () => {
    const line = source.split('\n').find(row => row.includes('const multipleItemsSelectedIds = computed'))
    expect(line).toBeDefined()
    expect(line).toContain('multipleCardsSelectedIds')
    expect(line).toContain('multipleBoxesSelectedIds')
    expect(line).toContain('multipleListsSelectedIds')
  })
})
