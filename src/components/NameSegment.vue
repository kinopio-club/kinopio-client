<template lang="pug">
span.name-segment
  template(v-if="segment.isText && segment.content")
    span.markdown(v-if="segment.markdown")
      template(v-for="markdown in segment.markdown")
        template(v-if="markdown.type === 'text'")
          span {{markdown.content}}
        template(v-else-if="markdown.type === 'link'")
          a(:href="markdown.result[2]") {{markdown.result[1]}}
        template(v-else-if="markdown.type === 'bold'")
          strong {{markdown.content}}
        template(v-else-if="markdown.type === 'emphasis'")
          em {{markdown.content}}
        template(v-else-if="markdown.type === 'strikethrough'")
          del {{markdown.content}}
        template(v-else-if="markdown.type === 'codeBlock'")
          pre {{markdown.content}}
        template(v-else-if="markdown.type === 'code'")
          code {{markdown.content}}
    span(v-if="!segment.markdown") {{segment.content}}
  //- Tags
  span.badge.button-badge(
    v-if="segment.isTag"
    :style="{backgroundColor: segment.color}"
    :class="{ active: currentSelectedTag.name === segment.name }"
    @click.left="showTagDetailsIsVisible($event, segment)"
    @touchend="showTagDetailsIsVisible($event, segment)"
    @keyup.stop.enter="showTagDetailsIsVisible($event, segment)"
    :data-tag-id="segment.id"
  ) {{segment.name}}
  //- Link
  a.link-badge-url(v-if="segment.isLink" :href="segment.name")
    span.badge.button-badge.link-badge(
      :class="{ active: currentSelectedLink.name === segment.name }"
      @click.left.prevent="showLinkDetailsIsVisible($event, segment)"
      @touchend.prevent="showLinkDetailsIsVisible($event, segment)"
      @keyup.stop.enter="showLinkDetailsIsVisible($event, segment)"
    )
      User(v-if="segment.space.users" :user="segment.space.users[0]" :isClickable="false")
      span {{segment.space.name || segment.content || segment.name }}
      img.icon.private(v-if="spaceIsPrivate(segment.space)" src="@/assets/lock.svg")

</template>

<script>
import User from '@/components/User.vue'

export default {
  name: 'NameSegment',
  components: {
    User
  },
  props: {
    segment: Object
  },
  computed: {
    currentSelectedTag () { return this.$store.state.currentSelectedTag },
    currentSelectedLink () { return this.$store.state.currentSelectedLink }
  },
  methods: {
    showTagDetailsIsVisible (event, tag) {
      this.$emit('showTagDetailsIsVisible', { event, tag })
    },
    showLinkDetailsIsVisible (event, link) {
      this.$emit('showLinkDetailsIsVisible', { event, link })
    },
    spaceIsPrivate (space) {
      if (!space.privacy) { return }
      return space.privacy === 'private'
    }
  }
}
</script>

<style lang="stylus">
.name-segment
  .markdown
    word-break break-word
    white-space pre-wrap
    a
      color var(--text-link)
      text-decoration underline
      &:hover
        text-decoration none
    strong
      font-weight normal
      background-color var(--info-background)
      border-radius 3px
    pre
      font-weight normal
      background-color var(--secondary-active-background)
      border-radius 3px
      margin 0
      white-space pre-wrap
    code
      font-weight normal
      background-color var(--secondary-active-background)
      border-radius 3px

  .link-badge-url
    color var(--primary)
    text-decoration none

  .link-badge
    background-color var(--secondary-active-background)
    .user
      .label-badge
        width 21px
        height 10px
        span
          font-size 10px
    .icon.private
      margin-left 6px

</style>
