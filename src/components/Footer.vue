<template lang="pug">
footer(v-if="!dialogsVisible")
  //span Beta {{buildHash}}
  .button-wrap
    button(@click="toggleUndoIsVisible")
      span U
    Undo(:visible="undoIsVisible")

</template>

<script>
import Undo from '@/components/dialogs/Undo.vue'

export default {
  name: 'Footer',
  components: {
    Undo
  },
  data () {
    return {
      undoIsVisible: false
    }
  },
  mounted () {
    console.log('🐢 kinopio-client', this.buildHash)
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.undoIsVisible = false
      }
    })
  },
  computed: {
    buildHash () {
      const regex = /(app\.)([a-z0-9])\w+/
      const scripts = Array.from(document.querySelectorAll('script'))
      const path = scripts.find(script => {
        const src = script.src
        return src.includes('app')
      })
      let hash = path.src.match(regex)[0] // app.768db305407f4c847d44
      return hash.replace('app.', '') // 768db305407f4c847d44
    },
    dialogsVisible () {
      return Boolean(this.$store.state.cardDetailsIsVisibleForCard || this.$store.state.multipleCardActionsIsVisible || this.$store.state.connectionDetailsIsVisibleForConnection)
    }
  },
  methods: {
    toggleUndoIsVisible () {
      const isVisible = this.undoIsVisible
      this.$store.commit('closeAllDialogs')
      this.undoIsVisible = !isVisible
    }
  }
}
</script>

<style lang="stylus">
footer
  z-index var(--max-z)
  position fixed
  right 8px
  bottom 8px
  pointer-events none
  > .button-wrap
    pointer-events all
    margin-left 6px
    display inline-block
    dialog
      left initial
      right 8px
      top initial
      bottom calc(100% - 4px)
</style>
