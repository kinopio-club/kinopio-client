import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'BoxSelecting.vue'),
  'utf8'
)

describe('box selecting while dragging', () => {
  it('treats a list drag like a card or box drag so a new selection cannot start', () => {
    const block = source.split('const shouldPreventBoxSelecting')[1].split('const currentUserStyles')[0]
    expect(block).toContain('currentUserIsDraggingCard')
    expect(block).toContain('currentUserIsDraggingBox')
    expect(block).toContain('currentUserIsDraggingList')
  })
})
