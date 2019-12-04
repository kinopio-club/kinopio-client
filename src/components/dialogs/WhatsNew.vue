<template lang="pug">
dialog.whats-new(v-if="visible" :open="visible" @click.stop)
  section
    .segmented-buttons
      button(@click="showWhatsNewVisible" :class="{active : whatsNewVisible}") What's New?
      button(@click="hideWhatsNewVisible" :class="{active : !whatsNewVisible}") Coming Up

  section(v-if="!newStuff.length && whatsNewVisible")
    Loader(:visible="true")

  section(v-if="whatsNewVisible")
    article(v-if="newStuff.length" v-for="post in newStuffWithUserHasRead" :key="post.id")
      p.title {{post.title}}
        img.icon(src="@/assets/new.gif" v-if="!post.userHasRead")
      span(v-html="media(post.description)")
      span(v-html="post.content_html")
    article
      .button-wrap
        a(href="https://www.are.na/kinopio/kinopio-updates")
          button Read All →

  section.coming-up(v-if="!whatsNewVisible")
    ul
      li
        del Import spaces
      li
        del Sign in to access your spaces on all your devices 🛫
      li
        del Share your spaces with other people (space urls)
      li Sharing privacy controls and inviting
      li Real-time collaboration 👯‍♀️
      li Updated Logo and illustrations
      li Billing and Payments (4$/month) 💞
      li API Docs and Support Pages
      li Dark mode 🌙
      li More frames 🖼
      li Keyboard Shortcuts

  section
    p Follow for Updates
    .button-wrap
      a(href="https://www.are.na/kinopio")
        button Are.na →
    .button-wrap
      a(href="https://twitter.com/KinopioClub")
        button Twitter →
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
      whatsNewVisible: true
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
    showWhatsNewVisible () {
      this.whatsNewVisible = true
    },
    hideWhatsNewVisible () {
      this.whatsNewVisible = false
    },
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
