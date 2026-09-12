import { describe, it, expect, vi } from 'vitest'
import utils from './utils.js'

describe('clearTrailingSlash', () => {
  it('removes trailing slash from string', () => {
    const result = utils.clearTrailingSlash('https://example.com/')
    expect(result).toBe('https://example.com')
  })

  it('handles string without trailing slash', () => {
    const result = utils.clearTrailingSlash('https://example.com')
    expect(result).toBe('https://example.com')
  })

  it('handles empty string', () => {
    const result = utils.clearTrailingSlash('')
    expect(result).toBeUndefined()
  })
})

describe('spaceIdFromUrl', () => {
  it('extracts space ID from URL and strips hidden parameter', () => {
    const url = 'https://kinopio.club/space-abcdefghijk1mn0pqrstu?hidden=true'
    const result = utils.spaceIdFromUrl(url)
    expect(result).toBe('abcdefghijk1mn0pqrstu')
  })

  it('extracts space ID from URL without hidden parameter', () => {
    const url = 'https://kinopio.club/space-abcdefghijk1mn0pqrstu'
    const result = utils.spaceIdFromUrl(url)
    expect(result).toBe('abcdefghijk1mn0pqrstu')
  })

  it('handles URLs with multiple hidden parameters', () => {
    const url = 'https://kinopio.club/space-abcdefghijk1mn0pqrstu?hidden=true&foo=bar&hidden=true'
    const result = utils.spaceIdFromUrl(url)
    expect(result).toBe('abcdefghijk1mn0pqrstu')
  })

  it('handles URLs with fragments', () => {
    const url = 'https://kinopio.club/space-abcdefghijk1mn0pqrstu#hello'
    const result = utils.spaceIdFromUrl(url)
    expect(result).toBe('abcdefghijk1mn0pqrstu')
  })

  it('returns undefined for invalid space IDs', () => {
    const url = 'https://kinopio.club/abcdefghijk1/n0pqrstu'
    const result = utils.spaceIdFromUrl(url)
    expect(result).toBeUndefined()
  })

  it('handles URLs that are too short to be a space', () => {
    const url = 'https://kinopio.club/k1mn0pqrstu'
    const result = utils.spaceIdFromUrl(url)
    expect(result).toBeUndefined()
  })

  it('uses window.location.href when no URL provided', () => {
    const originalLocation = window.location

    // Mock window.location
    delete window.location
    window.location = { href: 'https://kinopio.club/abcdefghijk1mn0pqrstu' }

    const result = utils.spaceIdFromUrl()
    expect(result).toBe('abcdefghijk1mn0pqrstu')

    // Restore original location
    window.location = originalLocation
  })

  it('handles empty URL gracefully', () => {
    const result = utils.spaceIdFromUrl('')
    expect(result).toBeUndefined()
  })
})

describe('idIsValid', () => {
  it('returns true for valid IDs', () => {
    const result = utils.idIsValid('validid123456789')
    expect(result).toBe(true)
  })

  it('returns undefined for IDs containing forward slash', () => {
    const result = utils.idIsValid('invalid/id')
    expect(result).toBeUndefined()
  })

  it('returns undefined for empty/null IDs', () => {
    expect(utils.idIsValid('')).toBeUndefined()
    expect(utils.idIsValid(null)).toBeUndefined()
    expect(utils.idIsValid(undefined)).toBeUndefined()
  })
})

describe('urlsFromString', () => {
  it('does not extract when scheme is missing', () => {
    const input = 'Visit example.com for info'
    const result = utils.urlsFromString(input)
    expect(result).toEqual(undefined)
  })

  it('extracts domain with trailing /', () => {
    const input = 'Visit https://example.com/ for info'
    const result = utils.urlsFromString(input)
    expect(result).toEqual(['https://example.com/'])
  })

  it('extracts domain with path URL', () => {
    const input = 'Check out https://example.com/about page'
    const result = utils.urlsFromString(input)
    expect(result).toEqual(['https://example.com/about'])
  })

  it('extracts domain with path and query parameters', () => {
    const input = 'Visit https://example.com/search?q=test&category=web'
    const result = utils.urlsFromString(input)
    expect(result).toEqual(['https://example.com/search?q=test&category=web'])
  })

  it('extracts domain with path and fragment', () => {
    const input = 'Go to https://example.com/docs#installation section'
    const result = utils.urlsFromString(input)
    expect(result).toEqual(['https://example.com/docs#installation'])
  })

  it('extracts domain with path, query parameters and fragment', () => {
    const input = 'https://example.com/page?id=123&type=full#section2 '
    const result = utils.urlsFromString(input)
    expect(result).toEqual(['https://example.com/page?id=123&type=full#section2'])
  })

  it('extracts multiple URLs from text', () => {
    const input = 'Visit https://example.com and https://www.example.com/api for more info'
    const result = utils.urlsFromString(input)
    expect(result).toEqual(['https://example.com', 'https://www.example.com/api'])
  })

  it('does not extract the trailing ?', () => {
    const input = 'Visit https://example.com/?'
    const result = utils.urlsFromString(input)
    expect(result).toEqual(['https://example.com/'])
  })
})

describe('urlWithoutQueryString', () => {
  it('removes query string from URL', () => {
    const result = utils.urlWithoutQueryString('https://example.com/path?foo=bar')
    expect(result).toBe('https://example.com/path')
  })

  it('handles URL without query string', () => {
    const result = utils.urlWithoutQueryString('https://example.com/path')
    expect(result).toBe('https://example.com/path')
  })

  it('handles URL with trailing slash via urlWithoutTrailingSlash', () => {
    const originalUrlWithoutTrailingSlash = utils.urlWithoutTrailingSlash
    utils.urlWithoutTrailingSlash = vi.fn().mockReturnValue('https://example.com')

    const result = utils.urlWithoutQueryString('https://example.com/?foo=bar')

    expect(utils.urlWithoutTrailingSlash).toHaveBeenCalledWith('https://example.com/?foo=bar')
    expect(result).toBe('https://example.com')

    utils.urlWithoutTrailingSlash = originalUrlWithoutTrailingSlash
  })
})

describe('queryString', () => {
  it('extracts query string from URL', () => {
    const result = utils.queryString('https://example.com?foo=bar&baz=qux')
    expect(result).toBe('foo=bar&baz=qux')
  })

  it('returns undefined for URL without query string', () => {
    const result = utils.queryString('https://example.com')
    expect(result).toBeUndefined()
  })

  it('returns empty string for URL with empty query string', () => {
    const result = utils.queryString('https://example.com?')
    expect(result).toBe('')
  })

  it('handles URLs with fragments', () => {
    const result = utils.queryString('https://example.com?foo=bar#fragment')
    expect(result).toBe('foo=bar')
  })
})

describe('isCompositionKeyboardEvent', () => {
  const enterKeydown = (options = {}) => {
    return new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, ...options })
  }
  const composition = (type) => {
    window.dispatchEvent(new CompositionEvent(type, { data: '日本' }))
  }

  it('ignores a normal enter keypress', () => {
    composition('compositionstart')
    composition('compositionend')
    const event = enterKeydown()
    // simulate time passing since the last composition
    Object.defineProperty(event, 'timeStamp', { value: 999999 })
    expect(utils.isCompositionKeyboardEvent(event)).toBe(false)
  })

  it('detects the enter that confirms IME input in chromium and firefox', () => {
    // keydown fires while still composing
    composition('compositionstart')
    expect(utils.isCompositionKeyboardEvent(enterKeydown({ isComposing: true }))).toBe(true)
    composition('compositionend')
  })

  it('detects composition keydowns that report keyCode 229', () => {
    const event = new KeyboardEvent('keydown', { keyCode: 229 })
    Object.defineProperty(event, 'timeStamp', { value: 999999 })
    expect(utils.isCompositionKeyboardEvent(event)).toBe(true)
  })

  it('detects the enter that confirms IME input in safari, where compositionend fires first', () => {
    composition('compositionstart')
    composition('compositionend')
    // safari keydown has isComposing false, but arrives in the same tick
    expect(utils.isCompositionKeyboardEvent(enterKeydown())).toBe(true)
  })
})

describe('removeOrphanedConnections', () => {
  it('keeps connections whose endpoints were both pasted', () => {
    const items = {
      cards: [{ id: 'a' }, { id: 'b' }],
      boxes: [],
      lists: [],
      connections: [
        { id: 'keep', startItemId: 'a', endItemId: 'b' }
      ]
    }
    const result = utils.removeOrphanedConnections(items)
    expect(result.connections.map(connection => connection.id)).toEqual(['keep'])
  })

  it('drops connections whose endpoints were not pasted and are not in the destination space', () => {
    const items = {
      cards: [{ id: 'a' }, { id: 'b' }],
      boxes: [],
      lists: [],
      connections: [
        { id: 'keep', startItemId: 'a', endItemId: 'b' },
        { id: 'drop', startItemId: 'a', endItemId: 'missing' }
      ]
    }
    const result = utils.removeOrphanedConnections(items)
    expect(result.connections.map(connection => connection.id)).toEqual(['keep'])
  })

  it('keeps a connection to an item already in the destination space', () => {
    const items = {
      cards: [{ id: 'a' }],
      boxes: [],
      lists: [],
      connections: [
        { id: 'to-existing', startItemId: 'a', endItemId: 'already-there' }
      ]
    }
    const result = utils.removeOrphanedConnections(items, ['already-there'])
    expect(result.connections.map(connection => connection.id)).toEqual(['to-existing'])
  })

  it('after uniqueSpaceItems remaps, drops connections whose other end was not copied', () => {
    const deltas = [
      { prevId: 'card-a', newId: 'card-a2' },
      { prevId: 'card-b', newId: 'card-b2' }
    ]
    const remapped = [
      { id: 'keep', startItemId: 'card-a', endItemId: 'card-b' },
      { id: 'drop', startItemId: 'card-a', endItemId: 'uncopied' }
    ].map(connection => ({
      ...connection,
      startItemId: utils.updateAllIds(connection, 'startItemId', deltas),
      endItemId: utils.updateAllIds(connection, 'endItemId', deltas)
    }))
    expect(remapped[0].startItemId).toBe('card-a2')
    expect(remapped[0].endItemId).toBe('card-b2')
    expect(remapped[1].endItemId).toBe('uncopied')
    const prepared = utils.removeOrphanedConnections({
      cards: [{ id: 'card-a2' }, { id: 'card-b2' }],
      boxes: [],
      lists: [],
      connections: remapped
    }, [])
    expect(prepared.connections.map(connection => connection.id)).toEqual(['keep'])
  })

  it('after uniqueSpaceItems remaps, list ids become connection endpoints', () => {
    const deltas = [
      { prevId: 'list-a', newId: 'list-a2' },
      { prevId: 'list-b', newId: 'list-b2' }
    ]
    const remapped = [
      { id: 'keep', startItemId: 'list-a', endItemId: 'list-b' },
      { id: 'drop', startItemId: 'list-a', endItemId: 'uncopied' }
    ].map(connection => ({
      ...connection,
      startItemId: utils.updateAllIds(connection, 'startItemId', deltas),
      endItemId: utils.updateAllIds(connection, 'endItemId', deltas)
    }))
    expect(remapped[0].startItemId).toBe('list-a2')
    expect(remapped[0].endItemId).toBe('list-b2')
    expect(remapped[1].endItemId).toBe('uncopied')
    const prepared = utils.removeOrphanedConnections({
      cards: [],
      boxes: [],
      lists: [{ id: 'list-a2' }, { id: 'list-b2' }],
      connections: remapped
    }, [])
    expect(prepared.connections.map(connection => connection.id)).toEqual(['keep'])
  })
})

describe('itemElement', () => {
  it('falls back to a list element when the id is not a card or box', () => {
    const orig = document.querySelector.bind(document)
    document.querySelector = (sel) => {
      if (String(sel).includes('data-list-id="list-1"')) {
        return { dataset: { listId: 'list-1' } }
      }
      return null
    }
    try {
      expect(utils.itemElement('list-1').dataset.listId).toBe('list-1')
    } finally {
      document.querySelector = orig
    }
  })
})

describe('listElementFromConnectorPosition', () => {
  it('returns the list-info under the cursor', () => {
    const listInfo = { classList: ['list-info'], dataset: { listId: 'list-1' } }
    const orig = document.elementsFromPoint
    document.elementsFromPoint = () => [listInfo]
    try {
      expect(utils.listElementFromConnectorPosition(10, 10)).toBe(listInfo)
    } finally {
      document.elementsFromPoint = orig
    }
  })
})
