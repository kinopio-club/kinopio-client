import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'CurrentConnection.vue'),
  'utf8'
)

describe('current connection list drop target', () => {
  it('falls back to estimatedItemConnectorPosition when a list has no connector button', () => {
    const block = source.split('const drawCurrentConnection')[1].split('const checkCurrentConnectionSuccess')[0]
    expect(block).toContain('connectorCoords')
    expect(block).toContain('estimatedItemConnectorPosition')
    expect(block).toContain('getSpaceItemById')
  })

  it('treats list-info as a drop target after cards and boxes', () => {
    const block = source.split('const checkCurrentConnectionSuccess')[1].split('const addConnections')[0]
    expect(block).toContain('cardElementFromPosition')
    expect(block).toContain('boxElementFromConnectorPosition')
    expect(block).toContain('listElementFromConnectorPosition')
    expect(block).toContain('listStore.getList')
    expect(block.indexOf('cardElement')).toBeLessThan(block.indexOf('listElementFromConnectorPosition'))
  })

  it('disables pointer events on the drawing overlay while a list is dragged', () => {
    const block = source.split('const connectionStyles')[1].split('const connectionPathStyles')[0]
    expect(block).toContain('currentUserIsDraggingCard')
    expect(block).toContain('currentUserIsDraggingBox')
    expect(block).toContain('currentUserIsDraggingList')
  })
})
