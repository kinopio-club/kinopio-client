import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'CardActions.vue'),
  'utf8'
)

describe('vote counter inside a list', () => {
  it('looks up the list by listId and restacks cards after the counter changes height', () => {
    const block = source.split('const toggleCounterIsVisible')[1].split('const toggleAtMentionPickerIsVisible')[0]
    expect(block).toContain('card.listId')
    expect(block).toContain('listStore.getList(listId)')
    expect(block).toContain('updateCardPositionsInList')
    expect(block).not.toContain('card.listStore')
  })
})
