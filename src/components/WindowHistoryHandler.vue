<template lang='pug'>
</template>

<script>
import utils from '@/utils.js'
import pageMeta from '@/pageMeta.js'

export default {
  name: 'WindowHistoryHandler',
  created () {
    this.$store.subscribe(async (mutation, state) => {
      if (mutation.type === 'triggerUpdateWindowHistory') {
        await this.updateWindowHistory(mutation.payload)
        this.updateWindowTitle()
      } else if (mutation.type === 'triggerUpdateWindowTitle') {
        this.updateWindowTitle()
      }
    })
  },
  computed: {
    currentSpace () { return this.$store.state.currentSpace }
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
      const space = this.$store.state.currentSpace
      pageMeta.spaceTitle(space)
    }
  }
}
</script>
