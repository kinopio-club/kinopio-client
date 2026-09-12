import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'MultipleSelectedActions.vue'),
  'utf8'
)

describe('multiple selected connection actions', () => {
  it('includes lists when connecting or disconnecting a mixed selection', () => {
    const line = source.split('\n').find(row => row.includes('const multipleItemsSelectedIds = computed'))
    expect(line).toBeDefined()
    expect(line).toContain('multipleCardsSelectedIds')
    expect(line).toContain('multipleBoxesSelectedIds')
    expect(line).toContain('multipleListsSelectedIds')
  })
})

describe('surround with box', () => {
  it('shows the surround action for lists as well as cards and boxes', () => {
    expect(source).toContain('.row(v-if="cardBoxOrListIsSelected")')
    const surround = source.split('Surround with Box')[1].split('Merge/Split')[0]
    expect(surround).toContain('listsIsSelected')
    expect(surround).toContain('boxesIsSelected')
    expect(surround).toContain('cardsIsSelected')
  })
})

describe('open-space list editability', () => {
  it('treats lists as created-by items when deciding if a selection is editable', () => {
    const created = source.split('const numberOfSelectedItemsCreatedByCurrentUser')[1].split('const multipleItemsSelectedIds')[0]
    expect(created).toContain('listsCreatedByCurrentUser')
    expect(created).toContain('lists: listsCreatedByCurrentUser.length')
    const canEdit = source.split('const canEditAll = computed')[1].split('const alignableItemsIsSelected')[0]
    expect(canEdit).toContain('numberOfSelectedItemsCreatedByCurrentUser.value.lists')
    expect(source).toContain('const editableLists = computed')
    const editable = source.split('const selectedItemsIsEditableByCurrentUser')[1].split('const numberOfSelectedItemsCreatedByCurrentUser')[0]
    expect(editable).toContain('editableLists.value.length === lists.value.length')
    expect(canEdit).toContain('!multipleLinesSelectedIds.value.length || userStore.getUserIsSpaceMember')
  })
})
