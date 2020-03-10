<template lang="pug">
dialog.whats-new(v-if="visible" :open="visible" @click.stop)
  section
    p What's New
    .button-wrap
      a(href="https://kinopio.club/-kinopio-roadmap-6TRE21gchHI7alHLuwzd5")
        button Roadmap →

  section(v-if="!newStuff.length")
    Loader(:visible="true")

  section
    article(v-if="newStuff.length" v-for="post in newStuffWithUserHasRead" :key="post.id")
      .title.badge.info {{post.title}}
        img.icon(src="@/assets/new.gif" v-if="!post.userHasRead")
      span(v-html="media(post.description)")
      span(v-html="post.content_html")

  section
    .button-wrap
      a(href="https://www.are.na/kinopio/kinopio-updates")
        button Read All →

  //- section
  //-   p Follow for Updates
  //-   .button-wrap
  //-     a(href="https://www.are.na/kinopio")
  //-       button Are.na →
  //-   .button-wrap
  //-     a(href="https://twitter.com/KinopioClub")
  //-       button Twitter →
</template>

<script>
import Loader from '@/components/Loader.vue'

export default {
  name: 'WhatsNew',
  components: {
    Loader
  },
  props: {
    visible: Boolean,
    newStuff: Array
  },
  data () {
    return {
      // newStuffIsUpdated: false
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs' && this.visible) {
        this.updateUserLastRead()
      }
    })
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
      const imageTypes = ['jpg', 'png', 'gif']
      const isImage = imageTypes.includes(description.slice(-3))
      if (isImage) {
        return `<img src="${description}"/>`
      } else {
        return `<video autoplay loop muted playsinline><source src="${description}"></video>`
      }
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        // this.checkNewStuffIsUpdated()
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
  @media(max-width: 360px)
    left -50px
  article
    position static
    margin-bottom 10px
    padding-bottom 10px
    border-bottom 1px solid var(--primary)
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
.coming-up
  ul
    margin 0
    margin-top 2px
    padding-left 15px
    list-style-type square
    li
      padding-top 10px
      margin-left 5px
      user-select text
      &:first-child
        padding-top 0

</style>
