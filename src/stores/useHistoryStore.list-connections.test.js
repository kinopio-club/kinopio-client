import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'useHistoryStore.js'),
  'utf8'
)

describe('undo and redo list history', () => {
  it('refreshes list connection paths after listUpdated, like cards and boxes', () => {
    const undoBlock = source.split("case 'listUpdated':")[1].split("case 'listCreated':")[0]
    const redoBlock = source.split("case 'listUpdated':")[2].split("case 'listCreated':")[0]
    expect(undoBlock).toContain('updateConnectionPathByItemId(list.id)')
    expect(redoBlock).toContain('updateConnectionPathByItemId(list.id)')
    expect(source).toContain('connectionStore.updateConnectionPathByItemId(card.id)')
    expect(source).toContain('connectionStore.updateConnectionPathByItemId(box.id)')
  })

  it('passes the list object into createList on restore, matching the store API', () => {
    const undoRemoved = source.split('async undo ()')[1].split('async redo')[0]
    const redoCreated = source.split('async redo (patch)')[1].split('redoLocalUpdates')[0]
    const undoRestore = undoRemoved.split("case 'listRemoved':")[1].split('this.updatePointer')[0]
    const redoRestore = redoCreated.split("case 'listCreated':")[1].split("case 'listRemoved':")[0]
    expect(undoRestore).toContain('createList({ list })')
    expect(redoRestore).toContain('createList({ list })')
    expect(redoRestore).not.toContain('createList(list.id)')
  })
})
