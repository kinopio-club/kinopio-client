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
    color: 'rgb(185, 167, 255)'
  },
  bulletin: {
    index: 1,
    color: 'pink'
  },
  'in-use': {
    index: 2,
    color: 'violet'
  }
  // 'in-use': {
  //   index: 3,
  //   color: 'salmon'
  // }
}

onMounted(() => {
  if (!consts.isStaticPrerenderingPage) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateSystemTheme)
    themeStore.restoreTheme()
  }
  // set css vars
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
// const currentPostIsGuide = computed(() => Boolean(currentPost.value?.spaceEmbedUrl))

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
      { property: 'og:type', content: video ? 'video.other' : (currentPost.value ? 'article' : 'website') }, // if video
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
        Wordmark(h2="blog updates" :isH1="currentSlugIsRoot")

      //- index
      template(v-if="currentSlugIsRoot")
        section#hello
          p
            span Behind the scenes of how new features are designed and built, and guides for using Kinopio in the real world. Also, the occasional progress bulletin. Completely hand-written.{{' '}}
            a(href="/blog/feed.json")
              span (rss)
          .row
            .button-wrap
              a(href="/changelog")
                button Changelog
        //- categories filter
        section.categories
          nav
            .row
              .badge.button-badge(
                v-for="category in categories"
                :key="category.slug"
                @click.stop="toggleCategory(category.slug)"
                :class="[category.slug, { active: state.category === category.slug }]"
              )
                span {{ category.name }}
        //- posts list
        section.posts
          ul
            li(v-for="post in postsFiltered" :key="post.slug")
              //- router-link.post-wrap(:to="`/blog/${post.slug}`")
              //- .row
              //- router-link(:to="`/blog/${post.slug}`")
              //-   img(v-if="post.image" :src="post.image")
              //-   video(v-else-if="post.video" autoplay loop muted playsinline)
              //-     source(:src="post.video")
              //- div
              router-link(:to="`/blog/${post.slug}`")
                .row.post-meta-row
                  span.badge.post-badge(v-if="post.category" :class="badgeClasses(post)")
                  //- {{ post.category }}
                  span.post-date {{ utils.shortAbsoluteDate(post.date) }}
                .row
                  //- span.badge.post-badge(v-if="post.category" :class="badgeClasses(post)")
                  h2 {{ post.title }}

              //- p(v-if="post.description") {{ post.description }}
              //- .row
              //-   p.post-meta.post-tag(v-if="post.category") {{ post.category }}
              //-   p.post-meta {{ utils.shortAbsoluteDate(post.date) }}

      //- ----------------- seperate into BlogPost??

      //- post
      section(v-else)
        article.post
          template(v-if="postContent")
            router-link(to="/blog")
              .badge.secondary.button-badge.all-posts-badge
                img.icon.left-arrow(src="@/assets/down-arrow.svg")
                span All Posts
            h1 {{ currentPost.title }}
            .row.post-meta-row
              span.badge(v-if="currentPost.category" :class="badgeClasses(currentPost)") {{ currentPost.category }}
              time.post-date(:datetime="currentPost.date") {{ utils.shortAbsoluteDate(currentPost.date) }}
            //- post md
            component(:is="postContent")

          //- 404
          template(v-else)
            h1 404 – Post not found
            router-link(to="/blog")
              .badge.button-badge.all-posts-badge
                span All Posts
            video(
              autoplay
              loop
              muted
              playsinline
              aria-label="404 image"
              poster="https://updates.kinopio.club/pages/help/404-poster.webp"
            )
              source(src="https://updates.kinopio.club/pages/help/404.webm")

      FooterSitemap
  Footer
</template>

<style lang="stylus">

main.blog-page-wrap
  section.intro
    margin-bottom 1rem
  .row
    display flex
  .badge
    color var(--primary-on-light-background)
    &.new-stuff
      background-color var(--new-stuff)
    &.bulletin
      background-color var(--bulletin)
    &.guides
      background-color var(--guides)
    &.in-use
      background-color var(--in-use)

  .posts
    .row
      align-items center
    ul
      list-style-type none
      padding 0
      li
        border-bottom 1px solid var(--secondary-border)
        margin-bottom .5rem
        a
          padding-bottom .5rem
          text-decoration none
          color var(--primary)
          display flex
          &:hover
            h2
              text-decoration underline
        .post-meta-row
          min-width 150px
          @media(max-width 500px)
            min-width 130px
        // img,
        // video
        //   background teal
        //   border-radius var(--entity-radius)
        //   width 100px
        //   height 60px
        //   margin-right 10px
        h2
          color var(--primary)
          font-family var(--header-font-4)
          font-weight normal
        .post-badge
          min-width initial
          min-height initial
          width 10px
          height 10px
          display inline-block

  .post-date
    color var(--primary)
    opacity 0.5

  article.post
    border-bottom 1px solid var(--primary-border)
    padding-bottom 2rem
    margin-bottom 4rem
    .row
      align-items center
    h1,
    h2,
    h3
      font-family var(--header-font-4)
      font-weight normal
    h1
      font-size 24px
    .all-posts-badge
      display inline-block
      margin-bottom 1rem
    .post-meta-row
      margin-bottom 2rem
    .markdown-body
      h1,
      h2,
      h3
        font-weight bold
        max-width 400px
        margin-top 1.4rem
      h2
        font-size 20px
      // > img
      //   margin-bottom 1rem
      //   border-radius var(--page-entity-radius)
      p
        margin 1rem 0
        max-width 440px
        &:last-child
          margin-bottom 0
        &:has(img),
        &:has(video)
          max-width 100%
      // a:not(.badge)
      //   color var(--text-link)
      //   &:hover
      //     text-decoration none
      video,
      img
        border-radius var(--page-entity-radius)
        // width 100%

      //   max-width 100%
      //   height auto
      blockquote
        margin 0
        p
          background var(--info-background)
          padding 12px
          border-radius var(--entity-radius)
      ul
        padding-left 2rem
        li
          max-width 410px
        li + li
          margin-top 1rem
</style>
