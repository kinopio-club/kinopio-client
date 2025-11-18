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

describe('addHiddenQueryStringToURLs', () => {
  it('adds hidden=true to a single URL', () => {
    const input = 'Check out https://example.com for more info'
    const result = utils.addHiddenQueryStringToURLs(input)
    expect(result).toBe('Check out https://example.com?hidden=true for more info')
  })

  it('adds hidden=true to multiple URLs', () => {
    const input = 'Visit https://example.com and https://test.com'
    const result = utils.addHiddenQueryStringToURLs(input)
    expect(result).toBe('Visit https://example.com?hidden=true and https://test.com?hidden=true')
  })

  it('adds hidden=true to URL that already has query parameters', () => {
    const input = 'Check https://example.com?foo=bar'
    const result = utils.addHiddenQueryStringToURLs(input)
    expect(result).toBe('Check https://example.com?foo=bar&hidden=true')
  })

  it('handles URLs with trailing slashes', () => {
    const input = 'Visit https://example.com/'
    const result = utils.addHiddenQueryStringToURLs(input)
    expect(result).toBe('Visit https://example.com?hidden=true')
  })

  it('skips iCloud URLs', () => {
    const input = 'Check https://www.icloud.com/photos for photos'
    const result = utils.addHiddenQueryStringToURLs(input)
    expect(result).toBe('Check https://www.icloud.com/photos for photos')
  })

  it('handles empty input', () => {
    const result = utils.addHiddenQueryStringToURLs('')
    expect(result).toBe('')
  })

  it('handles text with no URLs', () => {
    const input = 'This is just text with no URLs'
    const result = utils.addHiddenQueryStringToURLs(input)
    expect(result).toBe('This is just text with no URLs')
  })

  it('ignores image, video, audio, file, and space URLs', () => {
    const input = 'https://example.com/example.jpg https://example.com/example.mp4 https://example.com/example.mp3 https://example.com/example.txt https://kinopio.club/abc'
    const result = utils.addHiddenQueryStringToURLs(input)
    expect(result).toBe('https://example.com/example.jpg https://example.com/example.mp4 https://example.com/example.mp3 https://example.com/example.txt https://kinopio.club/abc')
  })

  it('handles URLs with fragments', () => {
    const input = 'Visit https://example.com/path#fragment'
    const result = utils.addHiddenQueryStringToURLs(input)
    expect(result).toBe('Visit https://example.com/path?hidden=true#fragment')
  })

  it('handles URLs with params and fragments', () => {
    const input = 'Visit https://example.com/path?existing=param#fragment'
    const result = utils.addHiddenQueryStringToURLs(input)
    expect(result).toBe('Visit https://example.com/path?existing=param&hidden=true#fragment')
  })
})

describe('removeHiddenQueryStringFromURLs', () => {
  it('removes hidden=true query parameter from single URL', () => {
    const input = 'Check out https://example.com?hidden=true for more info'
    const result = utils.removeHiddenQueryStringFromURLs(input)
    expect(result).toBe('Check out https://example.com for more info')
  })

  it('removes hidden=true from multiple URLs', () => {
    const input = 'Visit https://example.com?hidden=true and https://test.com?hidden=true'
    const result = utils.removeHiddenQueryStringFromURLs(input)
    expect(result).toBe('Visit https://example.com and https://test.com')
  })

  it('removes &hidden=true from URLs with other parameters', () => {
    const input = 'Check https://example.com?foo=bar&hidden=true'
    const result = utils.removeHiddenQueryStringFromURLs(input)
    expect(result).toBe('Check https://example.com?foo=bar')
  })

  it('handles URLs without hidden parameter', () => {
    const input = 'Visit https://example.com?foo=bar'
    const result = utils.removeHiddenQueryStringFromURLs(input)
    expect(result).toBe('Visit https://example.com?foo=bar')
  })

  it('handles URLs with multiple hidden parameters', () => {
    const input = 'Visit https://example.com?hidden=true&hidden=true'
    const result = utils.removeHiddenQueryStringFromURLs(input)
    expect(result).toBe('Visit https://example.com')
  })

  it('handles empty input', () => {
    const result = utils.removeHiddenQueryStringFromURLs('')
    expect(result).toBe('')
  })

  it('handles text with no URLs', () => {
    const input = 'This is just text with no URLs'
    const result = utils.removeHiddenQueryStringFromURLs(input)
    expect(result).toBe('This is just text with no URLs')
  })

  it('only removes exact hidden=true parameter', () => {
    const input = 'Check https://example.com?notsohidden=true&hidden=false'
    const result = utils.removeHiddenQueryStringFromURLs(input)
    expect(result).toBe('Check https://example.com?notsohidden=true&hidden=false')
  })
})
