import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'useSpaceStore.js'),
  'utf8'
)

describe('getSpaceSelectedItems connections', () => {
  it('treats selected lists as connection endpoints, not only cards and boxes', () => {
    const getter = source.split('getSpaceSelectedItems () {')[1].split('getSpaceSelectedAndDraggingItems')[0]
    const filterBlock = getter.split('getAllConnections.filter')[1].split('const selectedConnections')[0]
    expect(filterBlock).toContain('multipleCardsSelectedIds')
    expect(filterBlock).toContain('multipleBoxesSelectedIds')
    expect(filterBlock).toContain('multipleListsSelectedIds')
  })
})
