// line based yaml syntax highlighting,
// macrolight treats # anywhere as a comment and ' as the start of a string,
// and can't highlight keys, so yaml gets its own highlighter

const escape = (string) => {
  return string
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const span = (type, string) => {
  if (!string) { return '' }
  return `<span class="macrolight-${type}">${escape(string)}</span>`
}
const scalarSpan = (string) => `<span class="macrolight-keyword yaml-scalar">${escape(string)}</span>`

const documentMarkerPattern = /^(---|\.\.\.)(?=\s|$)/
const listPattern = /^(\s*)((?:-(?:\s+|$))*)(.*)$/
// key: value, the key ends at the first colon followed by a space or the end of the line
const keyPattern = /^("(?:[^"\\]|\\.)*"|'[^']*'|[^\s"'{[][\s\S]*?)(\s*:)(?=\s|$)/
const propertyPattern = /^([&*][^\s,[\]{}]+|!!?[^\s,[\]{}]*)(\s*)/
const blockScalarPattern = /^[|>][-+0-9]*\s*$/
const booleanPattern = /^(true|false|yes|no|on|off|null|~)$/i
const numberPattern = /^[-+]?(\d[\d_]*(\.\d*)?([eE][-+]?\d+)?|\.\d+|0x[\da-fA-F]+|0o[0-7]+|\.inf|\.nan)$/i
const datePattern = /^\d{4}-\d{2}-\d{2}([Tt ]\d{1,2}:\d{2}(:\d{2}(\.\d+)?)?\s*(Z|[-+]\d{1,2}(:?\d{2})?)?)?$/
const flowPattern = /("(?:[^"\\]|\\.)*"|'[^']*'|[[\]{},])/

// a comment starts with # at the start of a line or after whitespace, outside of quotes
const commentIndex = (line) => {
  let quote = null
  for (let index = 0; index < line.length; index++) {
    const character = line[index]
    // quotes only start a string at the start of a value, not mid word like don't
    const isValueStart = index === 0 || /[\s[{,:]/.test(line[index - 1])
    if (quote) {
      if (character === quote) { quote = null }
    } else if ((character === '"' || character === "'") && isValueStart) {
      quote = character
    } else if (character === '#' && (index === 0 || /\s/.test(line[index - 1]))) {
      return index
    }
  }
  return -1
}

const highlightFlow = (string) => {
  return string.split(flowPattern).map(part => {
    if (/^[[\]{},]$/.test(part)) {
      return span('punctuation', part)
    }
    if (/^["']/.test(part)) {
      return span('string', part)
    }
    return highlightPlainValue(part)
  }).join('')
}

const highlightPlainValue = (string) => {
  const value = string.trim()
  if (!value) {
    return escape(string)
  }
  const [leading] = string.match(/^\s*/)
  const trailing = string.slice(leading.length + value.length)
  let html
  if (booleanPattern.test(value) || numberPattern.test(value) || datePattern.test(value)) {
    html = scalarSpan(value)
  } else {
    html = escape(value)
  }
  return escape(leading) + html + escape(trailing)
}

// returns { html, isBlockScalar }
const highlightValue = (string) => {
  const [leading] = string.match(/^\s*/)
  let html = escape(leading)
  let value = string.slice(leading.length)
  // &anchor, *alias, !!tag
  let property = value.match(propertyPattern)
  while (property && property[1]) {
    html += span('punctuation', property[1]) + escape(property[2])
    value = value.slice(property[0].length)
    property = value.match(propertyPattern)
  }
  if (blockScalarPattern.test(value)) {
    return { html: html + span('punctuation', value), isBlockScalar: true }
  }
  if (/^["']/.test(value)) {
    html += span('string', value)
  } else if (/^[[{]/.test(value)) {
    html += highlightFlow(value)
  } else {
    html += highlightPlainValue(value)
  }
  return { html, isBlockScalar: false }
}

export default (string = '') => {
  let blockScalarIndent = null
  const lines = string.split('\n')
  const html = lines.map(line => {
    const indent = line.match(/^\s*/)[0].length
    // | or > block scalar text, continues while lines are more indented than its key
    if (blockScalarIndent !== null) {
      const isBlank = !line.trim()
      if (isBlank || indent > blockScalarIndent) {
        return span('string', line)
      }
      blockScalarIndent = null
    }
    let body = line
    let comment = ''
    const index = commentIndex(line)
    if (index !== -1) {
      body = line.slice(0, index)
      comment = line.slice(index)
    }
    const commentHTML = span('comment', comment)
    // --- or ... document markers
    const documentMarker = body.match(documentMarkerPattern)
    if (documentMarker) {
      return span('punctuation', documentMarker[0]) + highlightValue(body.slice(documentMarker[0].length)).html + commentHTML
    }
    // - list items
    const [, leading, dashes, rest] = body.match(listPattern)
    let html = escape(leading) + span('punctuation', dashes)
    let value = rest
    // key:
    const key = rest.match(keyPattern)
    if (key) {
      if (key[1] === '<<') {
        html += span('punctuation', key[1])
      } else {
        html += span('keyword', key[1])
      }
      html += span('punctuation', key[2])
      value = rest.slice(key[0].length)
    }
    const highlightedValue = highlightValue(value)
    if (highlightedValue.isBlockScalar) {
      blockScalarIndent = leading.length
      if (key) {
        blockScalarIndent += dashes.length
      }
    }
    return html + highlightedValue.html + commentHTML
  })
  return html.join('\n')
}
