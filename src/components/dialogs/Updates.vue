<template lang="pug">
dialog.updates(v-if="visible" :open="visible" @click.stop)
  section
    p Updates
    //img.icon(src="@/assets/new.gif")

  //section
    //(v-if="!updates.length")
    // todo a good loader
    // p loading…

  template(v-if="updates.length" v-for="update in updates")
    section(:key="update.id")
      p.title.badge {{update.title}}
      span(v-html="update.content_html")

  section
    p Latest Mood
    // loading v-if !mood
    img.mood(v-if="mood" :src="mood")

  section
    .button-wrap
      a(href="https://www.are.na/kinopio/kinopio-updates")
        button All Updates →
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
export default {
  name: 'Updates',
  props: {
    visible: Boolean,
    updates: Array
  },
  data () {
    return {
      mood: undefined
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs' && this.visible) {
        this.updateUserLastRead()
      }
    })
  },
  mounted () {
    this.getMoods().then(data => {
      const moods = data.contents
      this.mood = moods[0].image.large.url
    })
  },
  methods: {
    async getMoods () {
      const response = await fetch('https://api.are.na/v2/channels/kinopio-moods/contents?direction=desc')
      const data = await response.json()
      return data
    },
    updateUserLastRead () {
      const lastReadUpdateId = this.updates[0].id
      this.$store.commit('currentUser/updateLastReadUpdateId', lastReadUpdateId)
    }
  },
  watch: {
    visible (visible) {
      if (!visible) {
        this.updateUserLastRead()
      }
    }
  }
}
</script>

<style lang="stylus">
.updates
  overflow auto
  max-height calc(100vh - 150px)
  .title
    margin-bottom 10px
    &.badge
      background-color var(--secondary-background)
  .mood
    margin-top 10px
  img
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
