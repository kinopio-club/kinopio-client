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
