<template lang='pug'>
</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'WindowHistoryHandler',
  created () {
    this.$store.subscribe(async (mutation, state) => {
      if (mutation.type === 'triggerUpdateWindowHistory') {
        await this.updateWindowHistory(mutation.payload)
        this.updateWindowTitle()
      }
    })
  },
  computed: {
    currentSpace () { return this.$store.state.currentSpace },
    currentSpaceName () { return this.currentSpace.name }
  },
  methods: {
    async updateWindowHistory (space) {
      const isEmbedMode = this.$store.state.isEmbedMode
      space = space || this.currentSpace
      const spaceUrl = utils.url(space)
      const preventUpdate = window.location.pathname.includes(spaceUrl)
      if (preventUpdate) { return }
      const currentUserIsSignedIn = this.$store.getters['currentUser/isSignedIn']
      this.$store.commit('currentSpacePath', spaceUrl, { root: true })
      if (navigator.standalone || isEmbedMode) { return }
      await this.$router.push('/' + spaceUrl)
      const state = utils.clone(this.$store.state)
      history.replaceState({ ...history.state, ...state }, '')
    },
    updateWindowTitle () {
      const spaceName = this.currentSpaceName
      let title
      if (spaceName === 'Hello Kinopio') {
        title = 'Kinopio'
      } else if (spaceName) {
        title = `${spaceName} – Kinopio`
      } else {
        title = 'Kinopio'
      }
      document.title = title
    }
  }
}
</script>
