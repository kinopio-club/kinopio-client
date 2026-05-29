<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useUserStore } from '@/stores/useUserStore'

import AboutJsonLd from '@/components/pages/about/AboutJsonLd.vue'
import Header from '@/components/pages/Header.vue'
import Wordmark from '@/components/pages/Wordmark.vue'
import FooterSitemap from '@/components/pages/FooterSitemap.vue'
import Footer from '@/components/pages/Footer.vue'
import consts from '@/consts.js'
import utils from '@/utils.js'

import ApiDocs from '@/data/apiDocs.md'

const globalStore = useGlobalStore()
const themeStore = useThemeStore()
const userStore = useUserStore()

const appsButtonElement = ref(null)
let unsubscribes

const state = reactive({
  currentItems: []
})

let tableWrapObserver

const observeTableWraps = () => {
  tableWrapObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const sectionClass = Array.from(entry.target.classList).find(className => className !== 'section-wrap')
      if (!sectionClass) return
      if (entry.isIntersecting) {
        state.currentItems.push(sectionClass)
      } else {
        state.currentItems = state.currentItems.filter(item => item !== sectionClass)
      }
    })
  }, { threshold: 0.01 })
  document.querySelectorAll('.section-wrap').forEach(element => tableWrapObserver.observe(element))
}

if (!consts.isStaticPrerenderingPage) {
  window.globalStore = useGlobalStore()
  window.themeStore = useThemeStore()
  if (consts.isDevelopment()) {
    window.userStore = useUserStore()
  }
}

onMounted(() => {
  if (!consts.isStaticPrerenderingPage) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', logSystemThemeChange)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateSystemTheme)
    themeStore.restoreTheme()
  }
  if (consts.isDevelopment()) {
    document.title = '[DEV] Kinopio API Docs'
  } else {
    document.title = 'Kinopio API Docs'
  }
  if (!consts.isStaticPrerenderingPage) {
    nextTick(() => observeTableWraps())
  }
})

onBeforeUnmount(() => {
  tableWrapObserver?.disconnect()
})

const closeAllDialogs = () => {
  globalStore.closeAllDialogs()
}

// theme

const isThemeDark = computed(() => themeStore.getIsThemeDark)
const logSystemThemeChange = (event) => {
  const themeIsSystem = userStore.themeIsSystem
  console.warn('🌓 logSystemThemeChange', window.matchMedia('(prefers-color-scheme: dark)'), event, { themeIsSystem })
}
const updateSystemTheme = () => {
  themeStore.updateSystemTheme()
}

// toc

const items = computed(() => {
  let items = [
    {
      name: 'Users',
      color: '#b9a8ff'
    }, {
      name: 'Spaces',
      color: 'pink'
    }, {
      name: 'Cards',
      color: 'violet'
    }, {
      name: 'Connections',
      color: 'salmon'
    }, {
      name: 'Boxes',
      color: 'lightskyblue'
    }, {
      name: 'Lists',
      color: '#f9cb77'
    }, {
      name: 'Tags',
      color: 'mediumaquamarine'
    }, {
      name: 'Notifications',
      color: 'darkseagreen'
    }, {
      name: 'Other',
      color: 'cadetblue'
    }
  ]
  items = items.map(item => {
    const name = item.name.toLowerCase()
    item.link = `#${name}`
    if (!consts.isStaticPrerenderingPage) {
      utils.setCssVariable(`api-badge-${name}`, item.color)
    }
    return item
  })
  return items
})
</script>

<template lang="pug">
AboutJsonLd
.page(:class="{ 'is-dark-theme': isThemeDark }")
  Header(:isDocumentPage="true")
  main.page.api-page-wrap(@click="closeAllDialogs")
    .page-wrap
      section.intro
        Wordmark
        h2.page-title API Docs
        ul.api-toc
          li(v-for="item in items")
            a(:href="item.link")
              .badge.button-badge(:style="{ background: item.color }" :class="{ active: state.currentItems.includes(item.name.toLowerCase()) }") {{item.name}}
        article.api-docs
          ApiDocs

      FooterSitemap
  Footer
</template>

<style lang="stylus">
:root
  --api-badge-all khaki
main.api-page-wrap
  .page-wrap
    max-width 900px
  hr
    margin-top 2rem
    margin-bottom 1rem
  p
    max-width 440px // same as page.styl
  ul.api-toc
    padding 0
    position sticky
    top 45px
    // z-index 1
    li
      list-style none
      display inline-block
      a
        text-decoration none
      .badge
        color var(--primary-on-light-background)
  h2 + h2
    margin-top 0

  article.api-docs
    margin-bottom 3rem
    max-width 1000px
    p:has(.anchor)
      pointer-events none
    .anchor
      padding-top 100px // offset anchor link
      margin-top -100px
      display block
    h2
      font-size 18px
    h3
      font-size 16px
    h2,
    h3
      &.badge
        display inline-block
        padding 4px 5px
        padding-bottom 2px
        font-family sans-serif
        font-weight bold
        margin-bottom 0

  code
    background var(--secondary-background)
    margin-right 0

  .badge,
  code
    vertical-align 0
    position static
    &.all
      color var(--primary-on-light-background)
      background var(--api-badge-all)
    &.users
      color var(--primary-on-light-background)
      background var(--api-badge-users)
    &.spaces
      color var(--primary-on-light-background)
      background var(--api-badge-spaces)
    &.cards
      color var(--primary-on-light-background)
      background var(--api-badge-cards)
    &.connections
      color var(--primary-on-light-background)
      background var(--api-badge-connections)
    &.boxes
      color var(--primary-on-light-background)
      background var(--api-badge-boxes)
    &.lists
      color var(--primary-on-light-background)
      background var(--api-badge-lists)
    &.tags
      color var(--primary-on-light-background)
      background var(--api-badge-tags)
    &.notifications
      color var(--primary-on-light-background)
      background var(--api-badge-notifications)
    &.other
      color var(--primary-on-light-background)
      background var(--api-badge-other)
  a.badge
    text-decoration none
    color var(--primary)

  .table-wrap
    &.all
      table
        border-color var(--api-badge-all)
    &.users
      table
        border-color var(--api-badge-users)
    &.spaces
      table
        border-color var(--api-badge-spaces)
    &.cards
      table
        border-color var(--api-badge-cards)
    &.connections
      table
        border-color var(--api-badge-connections)
    &.boxes
      table
        border-color var(--api-badge-boxes)
    &.lists
      table
        border-color var(--api-badge-lists)
    &.tags
      table
        border-color var(--api-badge-tags)
    &.notifications
      table
        border-color var(--api-badge-notifications)
    &.other
      table
        border-color var(--api-badge-other)

  table
    background var(--primary-background)
    border-width 2px
    border-style solid
    table-layout fixed
    width 100%
    // th + th
    //   border-left 1px solid var(--primary-border)
    th,
    td
      padding 8px
    td
      border-right 0
    code
      background var(--secondary-background)
    tr
      &:hover
        background var(--secondary-hover-background)

  .table-wrap.all
    code
      > code
        background transparent
        padding 0
  // custom column widths

  .routes-table-wrap
    th
      // method
      &:nth-child(1)
        width 70px
      // path
      &:nth-child(2)
        @media(max-width 850px)
          width 250px
        @media(max-width 750px)
          width initial
      // auth
      &:nth-child(4)
        width 120px

  .attributes-table-wrap
    th
      // type
      &:nth-child(2)
        width 80px
    tr
      // name
      td:nth-child(1)
        code
          word-break break-word
</style>
