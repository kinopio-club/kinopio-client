<script setup>
import { reactive, computed, onMounted, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useThemeStore } from '@/stores/useThemeStore'

import Header from '@/components/pages/Header.vue'
import Wordmark from '@/components/pages/Wordmark.vue'
import FooterSitemap from '@/components/pages/FooterSitemap.vue'
import Footer from '@/components/pages/Footer.vue'
import blogPosts from 'virtual:blog-posts' // posts [{ slug, title, description, category, date, … }, {…}] from vite build, newest first
import consts from '@/consts.js'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const themeStore = useThemeStore()
const route = useRoute()

const siteDescription = "What's new in Kinopio, the thinking tool for building new ideas and solving hard problems"
const defaultImage = 'https://files.kinopio.club/og-image.png'

const categoryDetails = {
  'new-stuff': {
    index: 0,
    color: 'khaki'
  },
  bulletin: {
    index: 1,
    color: '#f0dba8'
  },
  guides: {
    index: 2,
    color: 'mediumaquamarine'
  },
  'in-use': {
    index: 3,
    color: '#b9a8ff'
  }
}

onMounted(() => {
  if (!consts.isStaticPrerenderingPage) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateSystemTheme)
    themeStore.restoreTheme()
  }
  // css category colors
  Object.keys(categoryDetails).forEach(key => utils.setCssVariable(key, categoryDetails[key].color))
})

const state = reactive({
  category: ''
})

// each md file becomes its own lazy-loaded chunk
const postModules = import.meta.glob('../blog/*.md')
const asyncPostComponents = {}
const asyncPostComponent = (slug) => {
  const loader = postModules[`../blog/${slug}.md`]
  if (!loader) { return null }
  if (!asyncPostComponents[slug]) {
    asyncPostComponents[slug] = defineAsyncComponent(loader)
  }
  return asyncPostComponents[slug]
}

const currentSlug = computed(() => route.params.post)
const currentSlugIsRoot = computed(() => !currentSlug.value)
const postContent = computed(() => asyncPostComponent(currentSlug.value))
const currentPost = computed(() => blogPosts.find(post => post.slug === currentSlug.value))
// guides embed the space they describe, and credit whoever made it
const currentPostIsGuide = computed(() => Boolean(currentPost.value?.spaceEmbedUrl))

const categories = Object.keys(categoryDetails)
  .map(slug => {
    const name = blogPosts.find(post => utils.normalizeString(post.category) === slug)?.category
    return { slug, name, index: categoryDetails[slug].index }
  })
  .filter(category => category.name)
  .sort((a, b) => a.index - b.index)

const categorySlug = (post) => utils.normalizeString(post.category)
const postsFiltered = computed(() => {
  if (!state.category) { return blogPosts }
  return blogPosts.filter(post => categorySlug(post) === state.category)
})
const toggleCategory = (slug) => {
  state.category = state.category === slug ? '' : slug
}

const closeAllDialogs = () => {
  globalStore.closeAllDialogs('page')
}

const imageType = (url) => {
  const extension = url.split('.').pop().toLowerCase()
  if (extension === 'webp') { return 'image/webp' }
  if (extension === 'jpg' || extension === 'jpeg') { return 'image/jpeg' }
  if (extension === 'gif') { return 'image/gif' }
  return 'image/png'
}

// JSON-LD Structured Data
// https://json-ld.org/
// blog pages are excluded from the page-meta edge function (see netlify.toml), so
// their structured data is generated here, from the markdown frontmatter that
// vite.config.js already parses into virtual:blog-posts

// same @id as the Organization in AboutJsonLd.vue, so both resolve to one entity
const organization = {
  '@type': 'Organization',
  '@id': 'https://kinopio.club/#organization',
  name: 'Kinopio',
  url: 'https://kinopio.club'
}
const author = {
  '@type': 'Person',
  name: 'Pirijan',
  url: 'https://pketh.org'
}
const breadcrumbSchema = (post, url) => {
  const itemListElement = [
    { '@type': 'ListItem', position: 1, name: 'Kinopio', item: 'https://kinopio.club' },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://kinopio.club/blog' }
  ]
  if (post) {
    itemListElement.push({ '@type': 'ListItem', position: 3, name: post.title, item: url })
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement
  }
}
const postSchema = (post, url, description, image) => {
  // a single blog post
  if (post) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description,
      url,
      image,
      articleSection: post.category,
      datePublished: post.date,
      inLanguage: 'en',
      isPartOf: {
        '@type': 'Blog',
        name: 'Kinopio Blog',
        url: 'https://kinopio.club/blog'
      },
      author,
      publisher: organization
    }
  }
  // the blog index, which lists every post
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Kinopio Blog',
    description,
    url,
    inLanguage: 'en',
    author,
    publisher: organization,
    // posts arrive newest first, so the first date is the freshest
    dateModified: blogPosts[0]?.date,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: blogPosts.length,
      itemListElement: blogPosts.map((post, index) => {
        return {
          '@type': 'ListItem',
          position: index + 1,
          name: post.title,
          url: `https://kinopio.club/blog/${post.slug}`
        }
      })
    }
  }
}

useHead(() => {
  let title = 'Kinopio Blog'
  let description = siteDescription
  let path = '/blog'
  let image = defaultImage
  if (currentPost.value) {
    title = `${currentPost.value.title} – Kinopio Blog`
    description = currentPost.value.description || siteDescription
    path = `/blog/${currentPost.value.slug}`
    image = currentPost.value.image || image
  }
  if (consts.isDevelopment()) {
    title = `[DEV] ${title}`
  }
  const url = `https://kinopio.club${path}`
  const video = currentPost.value?.video
  const videoMeta = []
  if (video) {
    videoMeta.push(
      { property: 'og:video', content: video },
      { property: 'og:video:secure_url', content: video },
      { property: 'og:video:type', content: 'video/mp4' }
    )
  }
  // override site defaults in index.html
  return {
    title,
    meta: [
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      // scrapers only activate the player when og:type is a video type
      { property: 'og:type', content: video ? 'video.other' : (currentPost.value ? 'article' : 'website') },
      { property: 'og:image', content: image },
      { property: 'og:image:type', content: imageType(image) },
      { name: 'twitter:image', content: image },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      ...videoMeta
    ],
    link: [
      { rel: 'canonical', href: url },
      { rel: 'alternate', type: 'application/rss+xml', href: 'https://kinopio.club/blog/feed.xml' },
      { rel: 'alternate', type: 'application/json', href: 'https://kinopio.club/blog/feed.json' }
    ],
    script: [
      { type: 'application/ld+json', innerHTML: JSON.stringify(postSchema(currentPost.value, url, description, image)) },
      { type: 'application/ld+json', innerHTML: JSON.stringify(breadcrumbSchema(currentPost.value, url)) }
    ]
  }
})

// styles

const isThemeDark = computed(() => themeStore.getIsThemeDark)
const updateSystemTheme = () => {
  themeStore.updateSystemTheme()
}
const badgeClasses = (post) => {
  const classes = [categorySlug(post)]
  if (currentSlug.value === post.slug) {
    classes.push('active')
  }
  return classes
}
</script>

<template lang="pug">
.page(:class="{ 'is-dark-theme': isThemeDark }")
  Header(:isDocumentPage="true")
  main.page.blog-page-wrap(@click="closeAllDialogs")
    .page-wrap
      section.intro
        Wordmark(h2="BLOG UPDATES" :isH1="currentSlugIsRoot")

      //- index
      template(v-if="currentSlugIsRoot")
        section#hello
          p
            img.icon.new(src="@/assets/pages/blog/new.gif" alt="new")
            span in Kinopio, the thinking tool for building new ideas and solving hard problems. All posts are completely hand-written with zero AI.
          .row
            .button-wrap
              a(href="/blog/feed.json")
                button RSS
            .button-wrap
              a(href="https://twitter.com/KinopioClub")
                button Follow @KinopioClub
          .row
            blockquote Subscribe to bulletin emails by signing up for&nbsp;
              a(href="https://kinopio.club") Kinopio

        section.categories
          nav
            ul
              li(v-for="category in categories" :key="category.slug" @click.stop="toggleCategory(category.slug)")
                .badge.button-badge(:class="[category.slug, { active: state.category === category.slug }]")
                  span {{ category.name }}

        section#index.index
          ul
            li(v-for="post in postsFiltered" :key="post.slug")
              router-link.post-wrap(:to="`/blog/${post.slug}`")
                img(v-if="post.image" :src="post.image" :alt="post.title")
                video(v-else-if="post.video" autoplay loop muted playsinline)
                  source(:src="post.video")
                h2 {{ post.title }}
                p(v-if="post.description") {{ post.description }}
                p.post-meta.post-tag(v-if="post.category") {{ post.category }}
                p.post-meta {{ post.metaDate }}

      //- post
      section(v-else)
        article(:class="{ guides: currentPostIsGuide }")
          template(v-if="postContent")
            router-link.category-name(to="/blog")
              .badge.secondary.button-badge
                img.icon.left-arrow(src="@/assets/down-arrow.svg")
                span All Posts
            h1 {{ currentPost.title }}
            img.icon.updated(src="@/assets/pages/blog/updated.gif" alt="updated")
            p.post-meta-row
              span.badge.button-badge(v-if="currentPost.category" :class="badgeClasses(currentPost)") {{ currentPost.category }}
              time.post-meta(:datetime="currentPost.date") {{ currentPost.metaDate }}
            hr
            //- guides credit the space's owner and embed it live
            template(v-if="currentPostIsGuide")
              aside.info
                section.title
                  p
                    span.user(:style="{ backgroundColor: currentPost.userColor }")
                    a(v-if="currentPost.userUrl" :href="currentPost.userUrl")
                      span {{ currentPost.userName }}
                    span(v-else) {{ currentPost.userName }}
                section
                  a(:href="currentPost.spaceUrl")
                    p {{ currentPost.spaceName }}
              .kinopio-embed
                .embed-title
                  span {{ currentPost.userShortName || currentPost.userName }}'s space
                  .badge Live Embed
                iframe(:src="currentPost.spaceEmbedUrl" :title="currentPost.spaceName" loading="lazy")
            //- post md
            component(:is="postContent")
          //- 404
          template(v-else)
            h1 404 – Post not found
            router-link.category-name(to="/blog")
              .badge.button-badge
                span All Posts
      FooterSitemap
  Footer
</template>

<style lang="stylus">

// main.blog-page-wrap
//   min-height 100dvh

//   section.intro
//     margin-bottom 1rem
//     h2
//       margin-bottom 0

//   section#hello
//     .row + .row
//       margin-top 10px
//     blockquote
//       margin-left 0
//       border-left 1px solid var(--primary-border)
//       padding-left 8px
//     img.new
//       vertical-align -3px
//       margin-right 4px

//   section.categories
//     nav
//       ul
//         padding 0
//         margin 0
//         display flex
//         flex-wrap wrap
//         gap 4px
//       li
//         list-style none
//         margin 0
//         cursor pointer

//   section#index
//     ul
//       width 100%
//       display flex
//       flex-wrap wrap
//       gap 1rem
//       padding 0
//       margin 0
//     li
//       list-style none
//       margin 0
//       max-width 30%
//       flex 1 1 220px
//       @media(max-width 574px)
//         max-width 100%
//     .post-wrap
//       display block
//       padding 12px
//       border-radius var(--entity-radius)
//       min-width 100px
//       height 100%
//       text-decoration none
//       box-shadow var(--badge-shadow)
//       color var(--primary-on-light-background)
//       img,
//       video
//         border-radius var(--entity-radius)
//         max-width 100%
//       h2
//         margin-top 1rem
//         margin-bottom 2px
//         font-size 18px
//       p
//         margin-top 0
//       &:hover,
//       &:focus
//         box-shadow var(--hover-shadow)
//       &:active
//         box-shadow var(--button-active-inset-shadow)

//   .post-meta
//     font-size 12px
//     opacity 0.6
//     margin 0
//   .post-meta-row
//     display flex
//     align-items center
//     gap 8px
//   .category-name
//     display block
//     width fit-content
//     text-decoration none
//     margin-bottom 1rem

//   img.icon.updated
//     width 50px
//     margin-bottom -10px

//   aside.info
//     border 1px solid var(--primary-border)
//     border-radius var(--entity-radius)
//     padding 8px
//     margin-bottom 1rem
//     section + section
//       margin-top 4px
//     p
//       margin 0
//     .user
//       display inline-block
//       width 12px
//       height 12px
//       border-radius 100px
//       vertical-align -1px
//       margin-right 4px

//   .kinopio-embed
//     margin-bottom 1rem
//     .embed-title
//       display flex
//       align-items center
//       gap 6px
//       margin-bottom 4px
//     iframe
//       width 100%
//       height 400px
//       border 1px solid var(--primary-border)
//       border-radius var(--entity-radius)

//   article
//     .markdown-body
//       margin-top 1rem
//       line-height 1.4
//       h1
//         margin-top 0
//         font-size 22px
//       h2
//         font-size 18px
//       h3
//         font-size 16px
//       p
//         max-width 520px
//       img:not(.icon),
//       video
//         border-radius var(--page-entity-radius)
//         max-width 100%
//         margin-top 1rem
//         margin-bottom 1rem
//         &.no-border
//           border-radius 0
//       code
//         background-color var(--secondary-background)
//         vertical-align 0
//         margin 0
//       ul,
//       ol
//         max-width 500px
//         padding-left 15px
//       li
//         line-height 1.4
//         p
//           margin-bottom 0.5rem
//       li + li
//         margin-top 0.5rem
//       blockquote
//         margin-left 0
//         border-left 1px solid var(--primary-border)
//         padding-left 8px

//   .badge
//     color var(--primary-on-light-background)
//     &.new-stuff
//       background-color var(--new-stuff)
//     &.bulletin
//       background-color var(--bulletin)
//     &.guides
//       background-color var(--guides)
//     &.in-use
//       background-color var(--in-use)

</style>
