<template lang="pug">
dialog.whats-new(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p What's New
    .button-wrap
      a(href="https://kinopio.club/-kinopio-roadmap-6TRE21gchHI7alHLuwzd5")
        button Roadmap →
    .button-wrap
      a(href="https://blog.kinopio.club")
        button Blog →
    .button-wrap
      button(@click.left="refreshBrowser")
        img.refresh.icon(src="@/assets/refresh.svg")

  section(v-if="!newStuff.length")
    Loader(:visible="true")

  section
    template(v-for="post in newStuffWithUserHasRead" :key="post.id")
      article(v-if="newStuff.length")
        .title.badge.info
          span {{post.title}}
          img.icon(src="@/assets/new.gif" v-if="!post.userHasRead")
        span(v-html="post.content_html")
        .media(v-html="media(post.description)")

  section
    .button-wrap
      a(href="https://www.are.na/kinopio/kinopio-what-s-new")
        button Read All →
</template>

<script>
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

export default {
  name: 'WhatsNew',
  components: {
    Loader
  },
  props: {
    visible: Boolean,
    newStuff: Array
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      }
      if (mutation.type === 'closeAllDialogs' && this.visible) {
        this.updateUserLastRead()
      }
    })
  },
  data () {
    return {
      dialogHeight: null
    }
  },
  computed: {
    newStuffWithUserHasRead () {
      let userHasRead
      const userlastReadId = parseInt(this.$store.state.currentUser.lastReadNewStuffId)
      return this.newStuff.map(update => {
        if (userlastReadId === update.id) {
          userHasRead = true
        }
        if (userHasRead) {
          update.userHasRead = true
        }
        return update
      })
    }
  },
  methods: {
    updateUserLastRead () {
      if (!this.newStuff.length) { return }
      const lastReadNewStuffId = this.newStuff[0].id
      this.$store.dispatch('currentUser/lastReadNewStuffId', lastReadNewStuffId)
    },
    // checkNewStuffIsUpdated () {
    //   const lastReadNewStuffId = this.newStuff[0].id
    //   const userlastReadId = parseInt(this.$store.state.currentUser.lastReadNewStuffId)
    //   this.newStuffIsUpdated = Boolean(userlastReadId !== lastReadNewStuffId)
    // },
    media (description) {
      if (!description) { return }
      const isImage = utils.urlIsImage(description)
      if (isImage) {
        return `<img src="${description}"/>`
      } else {
        return `<video autoplay loop muted playsinline><source src="${description}"></video>`
      }
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    },
    refreshBrowser () {
      window.location.reload()
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        // this.checkNewStuffIsUpdated()
        this.updateDialogHeight()
      }
      if (!visible) {
        this.updateUserLastRead()
      }
    }
  }
}
</script>

<style lang="stylus">
.whats-new
  overflow auto
  max-height calc(100vh - 210px)
  article
    position static
    margin-bottom 10px
    padding-bottom 10px
    border-bottom 1px solid var(--primary)
    .media
      margin-top 10px
    &:last-child
      margin-bottom 0
      padding-bottom 0
      border-bottom 0
  .icon
    margin-left 3px
  .title
    margin-bottom 10px
    display inline-block
  img,
  video
    max-width 100%
    border-radius 3px
  ul,
  ol
    margin 0
    margin-top 2px
    padding-left 15px
    li
      padding-top 10px
      margin-left 5px
      user-select text
  ul
    list-style-type square
  @media(max-width 340px)
    max-height calc(100vh - 200px)
  code
    background-color var(--secondary-background)
    margin 0
  .refresh
    margin 0
    height 11px
    vertical-align 0

</style>
