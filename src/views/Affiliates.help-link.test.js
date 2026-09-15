import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const vueSource = readFileSync(join(here, 'Affiliates.vue'), 'utf8')

describe('Affiliates help link', () => {
  it('points at an existing help article, not a missing slug', () => {
    const match = vueSource.match(/href="\/help\/([^"/]+)"/)
    expect(match).not.toBeNull()
    const slug = match[1].replace(/\/$/, '')
    expect(slug).not.toBe('affiliate-program')
    const helpFile = join(here, '..', 'help', `${slug}.md`)
    expect(existsSync(helpFile)).toBe(true)
    const article = readFileSync(helpFile, 'utf8')
    expect(article).toMatch(/title:\s*Affiliate Program/)
  })
})
