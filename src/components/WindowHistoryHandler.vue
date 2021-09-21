<template lang='pug'>
</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'WindowHistoryHandler',
  mounted () {
    console.log('🌹', this.$router, this.$store.state.currentSpace) // TEMP LOG
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerUpdateWindowHistory') {
        console.log('🌹', this.$router) // TEMP LOG
        console.log('🌸', mutation.payload) // TEMP LOG
        this.updateWindowHistory(mutation.payload)
        this.updateWindowTitle()
      }
    })
  },
  computed: {
    currentSpace () { return this.$store.state.currentSpace },
    currentSpaceName () { return this.currentSpace.name }
  },
  methods: {
    async updateWindowHistory ({ space, isRemote }) {
      console.log('🚛', space, isRemote) // TEMP LOG
      space = space || this.currentSpace
      const spaceUrl = utils.url(space)
      const currentUserIsSignedIn = this.$store.getters['currentUser/isSignedIn']
      const spaceHasUrl = currentUserIsSignedIn || isRemote
      if (spaceHasUrl) {
        this.$store.commit('currentSpacePath', spaceUrl, { root: true })
        if (navigator.standalone) { return }
        await this.$router.push(spaceUrl)
        const state = utils.clone(this.$store.state)
        history.replaceState({ ...history.state, ...state }, '')
        console.log('🍑 updateWindowHistory', space, isRemote, history.state) // TEMP LOG
      } else {
        this.$store.commit('currentSpacePath', '/', { root: true })
        if (navigator.standalone) { return }
        this.$router.replace({ path: '/' })
      }
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
      console.log('🍆 updateWindowTitle', title) // TEMP LOG
    }
  },
  watch: {
    currentSpaceName () {
      this.updateWindowTitle()
    }
  }
}
</script>
