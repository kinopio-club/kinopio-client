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

describe('list page size', () => {
  it('grows the page while a list is moved or resized, like boxes', () => {
    const source = readFileSync(join(dir, 'useListStore.js'), 'utf8')
    const move = source.split('moveLists ({ endCursor, prevCursor, delta, lists })')[1].split('// position')[0]
    const resize = source.split('async resizeLists (ids, delta)')[1].split('async clearResizeLists')[0]
    expect(source).toContain('updatePageSize (list)')
    expect(move).toContain('this.updatePageSize(list)')
    expect(resize).toContain('this.updatePageSize({')
  })
})
