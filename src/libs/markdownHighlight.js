// line based markdown syntax highlighting,
// macrolight is a generic tokenizer that only matches whole word keywords,
// and treats # and ' as comments and strings, so it can't highlight markdown prose

const escape = (string) => {
  return string
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const span = (type, string) => `<span class="macrolight-${type}">${string}</span>`

// `code`, [text](url), **bold**, __bold__, ~~strike~~, *italic*, _italic_
const inlinePattern = /(`[^`]+`)|(!?\[[^\]]*\]\([^)\s]*\))|(\*\*[^*]+\*\*|__[^_]+__)|(~~[^~]+~~)|(\*[^*\s][^*]*\*|\b_[^_\s][^_]*_\b)/g
const linkPattern = /^(!?\[)([^\]]*)(\]\()([^)]*)(\))$/

const highlightInline = (string) => {
  return string.replace(inlinePattern, (match, code, link, bold, strike, italic) => {
    if (code) {
      return span('string', match)
    }
    if (link) {
      const [, open, text, middle, url, close] = match.match(linkPattern)
      return span('punctuation', open) + span('keyword', text) + span('punctuation', middle) + span('string', url) + span('punctuation', close)
    }
    if (bold) {
      return span('punctuation', match.slice(0, 2)) + span('keyword', match.slice(2, -2)) + span('punctuation', match.slice(-2))
    }
    if (strike) {
      return span('punctuation', '~~') + `<span class="markdown-strike">${match.slice(2, -2)}</span>` + span('punctuation', '~~')
    }
    return span('punctuation', match[0]) + `<span class="markdown-italic">${match.slice(1, -1)}</span>` + span('punctuation', match.slice(-1))
  })
}

const highlightLine = (line) => {
  // # heading
  const heading = line.match(/^(\s*#{1,6})(\s.*)?$/)
  if (heading) {
    let text = heading[2]
    text = text || ''
    return span('keyword', heading[1]) + span('keyword', highlightInline(text))
  }
  // --- or *** horizontal rule
  if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
    return span('punctuation', line)
  }
  // > blockquote
  const quote = line.match(/^(\s*(?:&gt;\s?)+)(.*)$/)
  if (quote) {
    return span('punctuation', quote[1]) + span('comment', highlightInline(quote[2]))
  }
  // - list, * list, + list, 1. list, - [ ] task
  const list = line.match(/^(\s*(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?)(.*)$/)
  if (list) {
    return span('punctuation', list[1]) + highlightInline(list[2])
  }
  return highlightInline(line)
}

export default (string = '') => {
  let isInFence = false
  const lines = escape(string).split('\n')
  const html = lines.map(line => {
    // ``` fenced code block
    if (/^\s*(```|~~~)/.test(line)) {
      isInFence = !isInFence
      return span('punctuation', line)
    }
    if (isInFence) {
      return span('string', line)
    }
    return highlightLine(line)
  })
  return html.join('\n')
}
