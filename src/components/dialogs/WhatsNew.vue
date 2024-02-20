<template lang="pug">
dialog.whats-new(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p What's New
    .button-wrap
      a(href="https://kinopio.club/-kinopio-roadmap-6TRE21gchHI7alHLuwzd5")
        button
          span Roadmap{{' '}}
          img.icon.visit(src="@/assets/visit.svg")

    .button-wrap
      a(href="https://blog.kinopio.club")
        button
          span Blog{{' '}}
          img.icon.visit(src="@/assets/visit.svg")

  section(v-if="!newStuff.length")
    Loader(:visible="true")

  section
    template(v-for="item in newStuff" :key="item.id")
      a(:href="item.url" target="_blank")
        article.badge.button-badge(:style="{ backgroundColor: item._meta.color }")
          //- media
          template(v-if="item._meta.image && isOnline")
            img(:src="item._meta.image")
          template(v-else-if="item._meta.video")
            video(autoplay loop muted playsinline)
              source(:src="item._meta.video")
          //- title
          h1 {{item.title}}
          //- summary
          p.summary {{item.summary}}
    .button-wrap
      a(href="https://blog.kinopio.club")
        button
          span Read All{{' '}}
          img.icon.visit(src="@/assets/visit.svg")
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
    isOnline () { return this.$store.state.isOnline }
  },
  methods: {
    updateUserLastRead () {
      if (!this.newStuff.length) { return }
      const lastReadNewStuffId = this.newStuff[0].id
      this.$store.dispatch('currentUser/lastReadNewStuffId', lastReadNewStuffId)
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
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
  @media(max-height 500px)
    top -100px !important
  a
    text-decoration none
  article
    padding 8px
    border-radius var(--entity-radius)
    margin 0
    margin-bottom 10px
    padding-bottom 10px
    &:hover
      box-shadow 4px 4px 0 var(--heavy-shadow) !important
    &:active
      box-shadow var(--button-active-inset-shadow) !important
    h1,
    p.summary
      color var(--primary-on-light-background)
    img,
    video
      max-width 100%
      border-radius var(--entity-radius)
      margin-bottom 10px

  h1
    font-family var(--serif-font)
    font-size 16px
    font-weight normal
    text-decoration none
    margin-bottom 10px
    margin-top 0
    &:hover
      text-decoration none
</style>
