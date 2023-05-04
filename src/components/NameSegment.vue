<template lang="pug">
span.name-segment(:data-segment-types="dataMarkdownType" :data-tag-color="dataTagColor" :data-tag-name="dataTagName")
  template(v-if="segment.isText && segment.content")
    //- Name markdown
    span.markdown(v-if="segment.markdown")
      template(v-for="markdown in segment.markdown")
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
        template(v-else-if="markdown.type === 'emphasis'")
          em {{markdown.content}}
        template(v-else-if="markdown.type === 'strikethrough'")
          del {{markdown.content}}
        template(v-else-if="markdown.type === 'codeBlock'")
          pre {{markdown.content}}
        template(v-else-if="markdown.type === 'code'")
          code {{markdown.content}}
    //- Name results list
    template(v-if="!segment.markdown")
      span(v-if="search")
        NameMatch(:name="segment.content" :indexes="matchIndexes(segment.content)")
      span(v-else :class="{ strikethrough: isStrikeThrough }") {{segment.content}}
  //- Tags
  template(v-if="segment.isTag")
    Tag(:tag="segment" :isClickable="true" :isActive="currentSelectedTag.name === segment.name" @clickTag="showTagDetailsIsVisible")
  //- Other Space
  template(v-if="segment.isLink")
    OtherSpacePreview(:otherSpace="segment.otherSpace" :url="segment.name" :isActive="this.currentSelectedOtherItem === segment.name" @selectOtherSpace="showOtherSpaceDetailsIsVisible")
  //- File
  span.badge.secondary-on-dark-background(v-if="segment.isFile")
    img.icon(src="@/assets/file.svg")
    span {{segment.name}}
</template>

<script>
import NameMatch from '@/components/NameMatch.vue'
import Tag from '@/components/Tag.vue'
import OtherSpacePreview from '@/components/OtherSpacePreview.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

import fuzzy from '@/libs/fuzzy.js'

let shouldCancel = false

export default {
  name: 'NameSegment',
  components: {
    NameMatch,
    Tag,
    OtherSpacePreview,
    Loader
  },
  props: {
    segment: Object,
    search: String,
    isStrikeThrough: Boolean
  },
  computed: {
    currentSelectedTag () { return this.$store.state.currentSelectedTag },
    currentSelectedOtherItem () { return this.$store.state.currentSelectedOtherItem },
    dataMarkdownType () {
      if (this.segment.isTag) { return 'tag' }
      if (this.segment.isLink) { return 'link' }
      if (!this.segment.markdown) { return 'text' }
      let markdown = this.segment.markdown.filter(item => Boolean(item.content))
      const segmentIsEmpty = !utils.arrayExists(markdown)
      if (segmentIsEmpty) { return 'text' }
      let types = markdown.map(item => item.type)
      types = utils.arrayToString(types)
      return types
    },
    dataTagColor () {
      if (!this.segment.isTag) { return }
      return this.segment.color
    },
    dataTagName () {
      if (!this.segment.isTag) { return }
      return this.segment.name
    }
  },
  methods: {
    matchIndexes (name) {
      if (!name) { return [] }
      const options = {
        pre: '',
        post: ''
      }
      const filtered = fuzzy.filter(this.search, [name], options)
      if (filtered.length) {
        return filtered[0].indices
      } else {
        return []
      }
    },
    showTagDetailsIsVisible (event, tag) {
      this.$emit('showTagDetailsIsVisible', { event, tag })
    },
    showOtherSpaceDetailsIsVisible (options) {
      this.$emit('showOtherSpaceDetailsIsVisible', options)
    },
    escapedUrl (url) {
      if (url.includes('javascript:')) {
        return null
      }
      return url
    },
    updateShouldCancel (event) {
      shouldCancel = this.$store.state.preventDraggedCardFromShowingDetails
    },
    openUrl (event, url) {
      event.preventDefault()
      this.$store.dispatch('closeAllDialogs')
      if (shouldCancel) {
        shouldCancel = false
      } else {
        window.open(url) // opens url in new tab
      }
    }
  }
}
</script>

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
    pre
      font-weight normal
      background-color var(--secondary-active-background)
      border-radius var(--small-entity-radius)
      margin 0
      white-space pre-wrap
      vertical-align 0
    code
      font-weight normal
      background-color var(--secondary-active-background)
      border-radius var(--small-entity-radius)
      margin-right 0
      vertical-align 0
    pre,
    code
      color var(--primary)
      background-color var(--secondary-active-background)
    h1
      font-family var(--serif-font)
      font-size 22px
      font-weight bold
      margin 0
      display inline-block
    h2
      font-family var(--serif-font)
      font-weight normal
      font-size 20px
      margin 0
      display inline-block
    h3
      font-family var(--serif-font)
      font-weight normal
      font-size 16px
      margin 0
      display inline-block

  .strikethrough
    text-decoration line-through
  .badge
    > .loader
      margin-left 0 !important
      vertical-align -2px !important
</style>
