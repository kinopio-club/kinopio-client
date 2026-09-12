import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'List.vue'),
  'utf8'
)

describe('list connector button', () => {
  it('renders ItemConnectorButton for the list itself', () => {
    expect(source).toContain('ItemConnectorButton')
    expect(source).toContain(':list="props.list"')
    expect(source).toContain('currentConnectionStartItemIds.includes(props.list.id)')
  })

  it('records hover so list-to-list connections can highlight', () => {
    const block = source.split('const updateIsHover')[1].split('const startListInfoInteraction')[0]
    expect(block).toContain('currentUserIsHoveringOverListId')
  })
})
