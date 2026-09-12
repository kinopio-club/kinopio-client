import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const helpDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(helpDir, '..', '..')

describe('help article GitHub history links', () => {
  it('point at help files that exist in this repo', () => {
    const files = readdirSync(helpDir).filter(name => name.endsWith('.md'))
    const historyLink = /https:\/\/github\.com\/kinopio-club\/kinopio-client\/commits\/main\/(src\/help\/[^\s)]+)/g
    const checked = []
    for (const name of files) {
      const text = readFileSync(join(helpDir, name), 'utf8')
      for (const match of text.matchAll(historyLink)) {
        const relative = match[1]
        checked.push(relative)
        expect(existsSync(join(repoRoot, relative))).toBe(true)
      }
    }
    expect(checked).toContain('src/help/use-restrictions-policy.md')
    expect(checked).not.toContain('src/help/use-restriction-policy.md')
  })
})

describe('security.txt', () => {
  it('links to the bug-bounties help page without the old typo', () => {
    const text = readFileSync(join(repoRoot, 'public/security.txt'), 'utf8')
    expect(text).toContain('https://kinopio.club/help/bug-bounties')
    expect(text).toMatch(/for information on reporting bugs and bounties/i)
    expect(text).not.toMatch(/infomration/)
  })
})
