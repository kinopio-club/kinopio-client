import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'List.vue'),
  'utf8'
)

describe('list collapse connection paths', () => {
  it('refreshes paths for contained cards and the list itself', () => {
    const block = source.split('const updateIsCollapsed')[1].split('const addCard')[0]
    expect(block).toContain('updateConnectionPathsByItemIds(cardIds.concat([props.list.id]))')
  })
})
