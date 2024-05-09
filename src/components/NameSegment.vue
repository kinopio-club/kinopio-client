<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick, defineAsyncComponent } from 'vue'
import { useStore } from 'vuex'

import NameMatch from '@/components/NameMatch.vue'
import Tag from '@/components/Tag.vue'
import SystemCommand from '@/components/SystemCommand.vue'
import CodeBlock from '@/components/CodeBlock.vue'
import utils from '@/utils.js'

import fuzzy from '@/libs/fuzzy.js'
const store = useStore()

let shouldCancel = false

const props = defineProps({
  segment: Object,
  search: String,
  isStrikeThrough: Boolean,
  parentCardId: String,
  backgroundColorIsDark: Boolean
})
const emit = defineEmits(['showTagDetailsIsVisible'])

// state

const currentSelectedTag = computed(() => { return store.state.currentSelectedTag })
const currentSelectedOtherItem = computed(() => { return store.state.currentSelectedOtherItem })

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
  const options = {
    pre: '',
    post: ''
  }
  const filtered = fuzzy.filter(props.search, [name], options)
  if (filtered.length) {
    return filtered[0].indices
  } else {
    return []
  }
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
span.name-segment(:data-segment-types="dataMarkdownType" :data-tag-color="dataTagColor" :data-tag-name="dataTagName")
  template(v-if="props.segment.isText && props.segment.content")
    //- Name markdown
    span.markdown(v-if="props.segment.markdown" :class="{ 'is-background-dark': backgroundColorIsDark, 'is-background-light': !backgroundColorIsDark }")
      template(v-for="markdown in props.segment.markdown")
        template(v-if="markdown.type === 'text'")
          span {{markdown.content}}
        template(v-else-if="markdown.type === 'link'")
          a(@mouseup="updateShouldCancel" @click="openUrl($event, escapedUrl(markdown.result[2]))" :href="escapedUrl(markdown.result[2])") {{markdown.result[1]}}
        template(v-else-if="markdown.type === 'bold'")
          strong {{markdown.content}}
        template(v-else-if="markdown.type === 'h1'")
          h1 {{markdown.content}}
        template(v-else-if="markdown.type === 'h2'")
          h2 {{markdown.content}}
        template(v-else-if="markdown.type === 'h3'")
          h3 {{markdown.content}}
        template(v-else-if="markdown.type === 'h4'")
          h4 {{markdown.content}}
        template(v-else-if="markdown.type === 'emphasis'")
          em {{markdown.content}}
        template(v-else-if="markdown.type === 'strikethrough'")
          del {{markdown.content}}
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
  > .button-badge
    vertical-align 1px
  .markdown
    word-break break-word
    white-space pre-wrap
    a
      color var(--text-link)
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
