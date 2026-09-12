import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'useGlobalStore.js'),
  'utf8'
)

describe('duplicate-drag connections', () => {
  it('treats lists as connection endpoints along with cards and boxes', () => {
    const block = source.split('const connectableItemIds')[1].split('// current dragging item index')[0]
    expect(block).toContain('cards.concat(boxes, lists)')
  })
})
