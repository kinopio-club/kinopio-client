import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = dirname(fileURLToPath(import.meta.url))

describe('list connection path refresh', () => {
  it('updates connection paths when list state changes, like boxes do', () => {
    const source = readFileSync(join(dir, 'useListStore.js'), 'utf8')
    const block = source.split('updateListsState (updates) {')[1].split('async updateLists')[0]
    expect(block).toContain('updateConnectionPathsByItemIds')
    expect(block).toContain('updates.map(update => update.id)')
  })
})
