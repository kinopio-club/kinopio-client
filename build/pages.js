// Build-time compiling for the markdown pages: help pages from src/help/*.md and
// blog posts from src/blog/*.md.
//
// Frontmatter is parsed here and served to Help.vue and Blog.vue as the
// 'virtual:help-pages' and 'virtual:blog-posts' modules, so page metadata can be
// listed without statically importing the md files (which would merge their
// lazy-loaded chunks into the page chunk).
//
// Paths are relative to the project root, which is where vite runs.

import path from 'path'
import fs from 'fs'
import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'

const helpDir = './src/help'
const blogDir = './src/blog'

// page metadata

// gray-matter parses `date: 2021-01-21` into a Date, which JSON.stringify would
// widen into a full timestamp. Keep the yyyy-mm-dd the markdown declared, so
// serialized metadata stays stable and sorts lexicographically
const normalizeDates = (data) => {
  Object.keys(data).forEach(key => {
    if (data[key] instanceof Date) {
      data[key] = data[key].toISOString().split('T')[0]
    }
  })
  return data
}
const mdPages = (dir) => {
  return fs.readdirSync(dir)
    .filter(file => file.endsWith('.md') && file !== 'index.md')
    .map(file => {
      const markdown = fs.readFileSync(path.join(dir, file), 'utf8')
      const slug = file.replace('.md', '')
      return { slug, ...normalizeDates(matter(markdown).data) }
    })
}
export const helpPages = () => mdPages(helpDir)
// newest first, the order the blog index and both feeds render in
export const blogPosts = () => mdPages(blogDir).sort((a, b) => b.date.localeCompare(a.date))

// virtual modules

const mdPagesPlugin = ({ name, virtualId, watchPath, pages }) => {
  const resolvedVirtualId = '\0' + virtualId
  return {
    name,
    resolveId (id) {
      if (id === virtualId) { return resolvedVirtualId }
    },
    load (id) {
      if (id !== resolvedVirtualId) { return }
      return `export default ${JSON.stringify(pages())}`
    },
    // reload when frontmatter changes during dev
    handleHotUpdate ({ file, server }) {
      if (!file.includes(watchPath)) { return }
      const module = server.moduleGraph.getModuleById(resolvedVirtualId)
      if (module) { server.moduleGraph.invalidateModule(module) }
    }
  }
}
export const helpPagesPlugin = () => mdPagesPlugin({
  name: 'help-pages',
  virtualId: 'virtual:help-pages',
  watchPath: '/src/help/',
  pages: helpPages
})
export const blogPostsPlugin = () => mdPagesPlugin({
  name: 'blog-posts',
  virtualId: 'virtual:blog-posts',
  watchPath: '/src/blog/',
  pages: blogPosts
})

// blog feeds

const blogMeta = {
  title: 'Kinopio Blog',
  subtitle: "What's new in Kinopio, the thinking tool for building new ideas and solving hard problems",
  url: 'https://kinopio.club/blog',
  language: 'en',
  author: { name: 'Pirijan', url: 'https://pketh.org' }
}
const markdownRenderer = new MarkdownIt({ html: true })
const postUrl = (post) => `${blogMeta.url}/${post.slug}`
const postContentHtml = (post) => {
  const markdown = fs.readFileSync(path.join(blogDir, `${post.slug}.md`), 'utf8')
  return markdownRenderer.render(matter(markdown).content)
}
const escapeXml = (value) => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
// dates are yyyy-mm-dd, so anchor them to utc rather than the build machine's zone
const toDate = (date) => new Date(`${date}T00:00:00Z`)

const rssFeed = (posts) => {
  const items = posts.map(post => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl(post)}</link>
      <description>${escapeXml(postContentHtml(post))}</description>
      <pubDate>${toDate(post.date).toUTCString()}</pubDate>
      <dc:creator>${escapeXml(blogMeta.author.name)}</dc:creator>
      <guid>${postUrl(post)}</guid>
    </item>`).join('\n')
  return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xml:base="${blogMeta.url}" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(blogMeta.title)}</title>
    <link>${blogMeta.url}</link>
    <atom:link href="${blogMeta.url}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(blogMeta.subtitle)}</description>
    <language>${blogMeta.language}</language>
${items}
  </channel>
</rss>
`
}
const jsonFeed = (posts) => {
  return JSON.stringify({
    version: 'https://jsonfeed.org/version/1',
    title: blogMeta.title,
    home_page_url: blogMeta.url,
    feed_url: `${blogMeta.url}/feed.json`,
    description: blogMeta.subtitle,
    author: blogMeta.author,
    items: posts.map(post => ({
      id: postUrl(post),
      url: postUrl(post),
      title: post.title,
      content_html: postContentHtml(post),
      date_published: toDate(post.date).toISOString(),
      summary: post.description || '',
      image: post.image || '',
      _meta: {
        image: post.image || '',
        video: post.video || ''
      }
    }))
  }, null, 2)
}
export const blogFeedsPlugin = () => {
  let isSSRBuild = false
  return {
    name: 'blog-feeds',
    apply: 'build',
    enforce: 'post',
    configResolved (config) {
      isSSRBuild = Boolean(config.build.ssr)
    },
    generateBundle () {
      // vite-ssg builds twice, only the client build writes to dist
      if (isSSRBuild) { return }
      const posts = blogPosts()
      this.emitFile({ type: 'asset', fileName: 'blog/feed.xml', source: rssFeed(posts) })
      this.emitFile({ type: 'asset', fileName: 'blog/feed.json', source: jsonFeed(posts) })
      console.log(`✓ Created blog feeds for ${posts.length} posts`)
    }
  }
}
