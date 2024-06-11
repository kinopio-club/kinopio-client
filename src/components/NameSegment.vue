<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick, defineAsyncComponent } from 'vue'
import { useStore } from 'vuex'

import NameMatch from '@/components/NameMatch.vue'
import Tag from '@/components/Tag.vue'
import SystemCommand from '@/components/SystemCommand.vue'
import CodeBlock from '@/components/CodeBlock.vue'
import utils from '@/utils.js'
import fonts from '@/data/fonts.js'

import createFuzzySearch from '@nozbe/microfuzz'
import smartquotes from 'smartquotes'

const store = useStore()

let shouldCancel = false

const props = defineProps({
  segment: Object,
  search: String,
  isStrikeThrough: Boolean,
  parentCardId: String,
  backgroundColorIsDark: Boolean,
  headerFontId: Number,
  headerFontSize: String
})
const emit = defineEmits(['showTagDetailsIsVisible'])

// state

const currentSelectedTag = computed(() => { return store.state.currentSelectedTag })
const currentSelectedOtherItem = computed(() => { return store.state.currentSelectedOtherItem })

// styling

const nameSegmentClasses = computed(() => {
  const fontId = props.headerFontId || 0
  const fontSize = props.headerFontSize || 's'
  let classes = [
    `header-font-${fontId}`,
    `header-font-size-${fontSize}`
  ]
  const font = fonts.find(item => item.id === fontId)
  const fontSizeModifier = font?.size || ''
  if (fontSizeModifier) {
    classes.push(`header-font-size-modifier-${fontSizeModifier}`)
  }
  return classes
})
const smartQuotes = (string) => {
  return smartquotes(string)
}

// segment data

const dataMarkdownType = computed(() => {
  if (props.segment.isTag) { return 'tag' }
  if (props.segment.isLink) { return 'link' }
  if (props.segment.isInviteLink) { return 'inviteLink' }
  if (!props.segment.markdown) { return 'text' }
  let markdown = props.segment.markdown.filter(item => Boolean(item.content))
  const segmentIsEmpty = !utils.arrayHasItems(markdown)
  if (segmentIsEmpty) { return 'text' }
  let types = markdown.map(item => item.type)
  types = utils.arrayToString(types)
  return types
})
const dataTagColor = computed(() => {
  if (!props.segment.isTag) { return }
  return props.segment.color
})
const dataTagName = computed(() => {
  if (!props.segment.isTag) { return }
  return props.segment.name
})
const isSpaceLink = (segment) => {
  if (segment.cardId) { return }
  return segment.isLink
}
const escapedUrl = (url) => {
  if (url.includes('javascript:')) {
    return null
  }
  return url
}

// search

const matchIndexes = (name) => {
  if (!name) { return [] }
  const nameObject = [ { name } ]
  const fuzzySearch = createFuzzySearch(nameObject, {
    getText: (item) => [item.name, item.urlPreviewTitle, item.urlPreviewDescription]
  })
  let results = fuzzySearch(props.search)
  console.log(results)
  let matchIndexes = []
  results.forEach(result => {
    result.matches = result.matches.filter(match => Boolean(match))
    result.matches.forEach(match => {
      match.forEach(matchRange => {
        // match = [0, 2]
        const range = utils.generateRange(matchRange[0], matchRange[1]) // [0,1,2]
        matchIndexes = matchIndexes.concat(range)
      })
    })
  })
  return matchIndexes || []
}

// click

const updateShouldCancel = (event) => {
  shouldCancel = store.state.preventDraggedCardFromShowingDetails
}
const openUrl = (event, url) => {
  event.preventDefault()
  store.dispatch('closeAllDialogs')
  if (shouldCancel) {
    shouldCancel = false
  } else {
    window.open(url) // opens url in new tab
  }
}
const showTagDetailsIsVisible = (event, tag) => {
  emit('showTagDetailsIsVisible', { event, tag })
}
</script>

<template lang="pug">
span.name-segment(:data-segment-types="dataMarkdownType" :data-tag-color="dataTagColor" :data-tag-name="dataTagName" :class="nameSegmentClasses")
  template(v-if="props.segment.isText && props.segment.content")
    //- Name markdown
    span.markdown(v-if="props.segment.markdown" :class="{ 'is-background-dark': backgroundColorIsDark, 'is-background-light': !backgroundColorIsDark }")
      template(v-for="markdown in props.segment.markdown")
        template(v-if="markdown.type === 'text'")
          span {{smartQuotes(markdown.content)}}
        template(v-else-if="markdown.type === 'link'")
          a(@mouseup="updateShouldCancel" @click="openUrl($event, escapedUrl(markdown.result[2]))" :href="escapedUrl(markdown.result[2])") {{markdown.result[1]}}
        template(v-else-if="markdown.type === 'bold'")
          strong {{smartQuotes(markdown.content)}}
        template(v-else-if="markdown.type === 'h1'")
          h1 {{smartQuotes(markdown.content)}}
        template(v-else-if="markdown.type === 'h2'")
          h2 {{smartQuotes(markdown.content)}}
        template(v-else-if="markdown.type === 'h3'")
          h3 {{smartQuotes(markdown.content)}}
        template(v-else-if="markdown.type === 'h4'")
          h4 {{markdown.content}}
        template(v-else-if="markdown.type === 'emphasis'")
          em {{smartQuotes(markdown.content)}}
        template(v-else-if="markdown.type === 'strikethrough'")
          del {{smartQuotes(markdown.content)}}
        template(v-else-if="markdown.type === 'codeBlock'")
          CodeBlock(:content="markdown.content" :parentCardId="props.parentCardId")
        template(v-else-if="markdown.type === 'code'")
          code {{markdown.content}}
    //- Name results list
    template(v-if="!props.segment.markdown")
      span(v-if="props.search")
        NameMatch(:name="props.segment.content" :indexes="matchIndexes(props.segment.content)")
      span(v-else :class="{ strikethrough: props.isStrikeThrough }") {{props.segment.content}}
  //- Tags
  template(v-if="props.segment.isTag")
    Tag(:tag="props.segment" :isClickable="true" :isActive="currentSelectedTag.name === props.segment.name" @clickTag="showTagDetailsIsVisible")
  //- File
  span.badge.secondary-on-dark-background(v-if="props.segment.isFile")
    img.icon(src="@/assets/file.svg")
    span {{props.segment.name}}
  //- System Command
  template(v-if="props.segment.isCommand")
    SystemCommand(:command="props.segment.command" :name="props.segment.name")
</template>

<style lang="stylus">
.name-segment
  --header-font var(--header-font-0)
  &.header-font-1
    --header-font var(--header-font-1)
  &.header-font-2
    --header-font var(--header-font-2)
  &.header-font-3
    --header-font var(--header-font-3)
  &.header-font-4
    --header-font var(--header-font-4)
  &.header-font-5
    --header-font var(--header-font-5)
  &.header-font-6
    --header-font var(--header-font-6)
  &.header-font-7
    --header-font var(--header-font-7)
  &.header-font-8
    --header-font var(--header-font-8)
  &.header-font-9
    --header-font var(--header-font-9)
  &.header-font-size-modifier-s
    .markdown
      h1
        font-size 20px
      h2
        font-size 18px
  &.header-font-size-m
    .markdown
      h1
        font-size 44px
      h2
        font-size 36px
  &.header-font-size-l
    .markdown
      h1
        font-size 66px
      h2
        font-size 52px

  > .button-badge
    vertical-align 1px
  .markdown
    word-break break-word
    white-space pre-wrap
    a
      color var(--text-link) !important
      text-decoration underline
      text-decoration-thickness 1px // for firefox
      -webkit-touch-callout none // for ios
      &:hover
        text-decoration none
    code
      color var(--primary)
      background-color var(--secondary-active-background)
      font-weight normal
      background-color var(--secondary-active-background)
      border-radius var(--small-entity-radius)
      margin-right 0
      vertical-align 0
    h1
      font-family var(--header-font)
      font-size 22px
      font-weight bold
      margin 0
      display inline-block
    h2
      font-family var(--header-font)
      font-weight normal
      font-size 20px
      margin 0
      display inline-block
    h3
      font-family var(--header-font)
      font-weight normal
      font-size 16px
      margin 0
      display inline-block
    h4
      font-family var(--glyphs-font)
      font-size 44px
      margin 0
    &.is-background-light
      span,
      a,
      h1,
      h2,
      h3,
      h4,
      em,
      strong
       color var(--primary-on-light-background)
    &.is-background-dark
      span,
      a,
      h1,
      h2,
      h3,
      h4,
      em,
      strong
       color var(--primary-on-dark-background)

  .strikethrough
    text-decoration line-through
  .badge
    > .loader
      margin-left 0 !important
      vertical-align -2px !important
</style>
