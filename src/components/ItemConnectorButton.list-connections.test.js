import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'ItemConnectorButton.vue'),
  'utf8'
)

describe('connector button multi-select', () => {
  it('starts a connection from selected lists as well as cards and boxes', () => {
    const block = source.split('const createCurrentConnection')[1].split('// connector button')[0]
    expect(block).toContain('multipleCardsSelectedIds')
    expect(block).toContain('multipleBoxesSelectedIds')
    expect(block).toContain('multipleListsSelectedIds')
  })
})
