import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'Connection.vue'),
  'utf8'
)

describe('connection list endpoints', () => {
  it('resolves start and end items through getSpaceItemById so lists are included', () => {
    const block = source.split('const items = computed')[1].split('const isConnectedToCommentCard')[0]
    expect(block).toContain('getSpaceItemById(startItemId)')
    expect(block).toContain('getSpaceItemById(endItemId)')
  })

  it('treats selected lists as connected endpoints, not only cards', () => {
    const block = source.split('const isConnectedToMultipleCardsSelected')[1].split('const isHoveredOverConnectedItem')[0]
    expect(block).toContain('multipleCardsSelectedIds')
    expect(block).toContain('multipleBoxesSelectedIds')
    expect(block).toContain('multipleListsSelectedIds')
  })
})
