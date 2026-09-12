import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'ConnectionLabel.vue'),
  'utf8'
)

describe('connection label list endpoints', () => {
  it('resolves start and end items through getSpaceItemById so lists are included', () => {
    const block = source.split('const items = computed')[1].split('const visible = computed')[0]
    expect(block).toContain('getSpaceItemById(startItemId)')
    expect(block).toContain('getSpaceItemById(endItemId)')
    expect(block).not.toContain('cardStore.byId')
    expect(block).not.toContain('boxStore.byId')
  })
})
