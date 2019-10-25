<template lang="pug">
dialog.new-stuff(v-if="visible" :open="visible" @click.stop)
  section
    p New Stuff
      img.updated.icon(src="@/assets/updated.gif" v-if="newStuffIsUpdated")

  section(v-if="!newStuff.length")
    Loader(:visible="true")

  section
    article(v-if="newStuff.length" v-for="post in newStuffWithUserHasRead" :key="post.id")
      p.title {{post.title}}
        img.icon(src="@/assets/new.gif" v-if="!post.userHasRead")
      span(v-html="media(post.description)")
      span(v-html="post.content_html")

  section
    .button-wrap
      a(href="https://www.are.na/kinopio/kinopio-updates")
        button Read All →

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
  name: 'NewStuff',
  components: {
    Loader
  },
  props: {
    visible: Boolean,
    newStuff: Array
  },
  data () {
    return {
      newStuffIsUpdated: false
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
      const userlastRead = this.$store.state.currentUser.lastReadNewStuffId
      return this.newStuff.map(update => {
        if (userlastRead === update.id) {
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
      const lastReadNewStuffId = this.newStuff[0].id
      this.$store.dispatch('currentUser/lastReadNewStuffId', lastReadNewStuffId)
    },
    checkNewStuffIsUpdated () {
      const lastReadNewStuffId = this.newStuff[0].id
      const userlastReadId = this.$store.state.currentUser.lastReadNewStuffId
      this.newStuffIsUpdated = Boolean(userlastReadId !== lastReadNewStuffId)
    },
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
        this.checkNewStuffIsUpdated()
      }
      if (!visible) {
        this.updateUserLastRead()
      }
    }
  }
}
</script>

<style lang="stylus">
.new-stuff
  overflow auto
  max-height calc(100vh - 150px)
  article
    position static
    margin-bottom 10px
    padding-bottom 10px
    border-bottom 1px solid var(--primary)
    &:last-child
      margin-bottom 0
      padding-bottom 0
      border-bottom 0
  .loader
    margin-top 10px
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
    left calc(-100% + 16px)
    max-height calc(100vh - 200px)
</style>
