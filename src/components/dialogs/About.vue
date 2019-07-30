<template lang="pug">
dialog.about(v-if="visible" :open="visible")
  section.kaomoji-section
    p ༼ つ ◕_◕ ༽つ
    p Does it feel good to create, and connect your thoughts, ideas, and plans with Kinopio?
    button
      span Feedback 💌
    button Beta Notes
  section
    // button(@click="clearData")
    //   img.icon(src="@/assets/remove.svg")
    //   span Clear Data
    button(@click="exportToJSON")
      span Export Data
    a#downlaod-anchor.hidden
  section
    a(href="https://twitter.com/KinopioClub")
      button Twitter →
</template>

<script>
export default {
  name: 'About',
  props: {
    visible: Boolean
  },
  methods: {
    exportToJSON () {
      const json = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.$store.state.currentSpace))
      const downloadAnchor = document.getElementById('downlaod-anchor')
      const spaceId = this.$store.state.currentSpace.id
      downloadAnchor.setAttribute('href', json)
      downloadAnchor.setAttribute('download', `kinopio-space-${spaceId}.json`)
      downloadAnchor.click()
    }
    // clearData () {
    //   const spaceId = this.$store.state.currentSpace.id.toString()
    //   localStorage.removeItem(`space-${spaceId}`)
    //   this.$store.commit('currentSpace/restoreSpace', { id: spaceId })
    //   this.$store.commit('currentSpace/cacheSpace')
    // }
  }
}
</script>

<style lang="stylus">
.about
  top calc(100% - 8px)
  .hidden
    display none
  .kaomoji-section
    padding-top 14px
</style>
