<template lang="pug">
footer(v-if="!dialogsVisible")
  //span Beta {{buildHash}}
  .button-wrap
    button(@click="toggleRestoreIsVisible" :class="{ active: restoreIsVisible}")
      img.refresh.icon(src="@/assets/undo.svg")
    Restore(:visible="restoreIsVisible")

</template>

<script>
import Restore from '@/components/dialogs/Restore.vue'

export default {
  name: 'Footer',
  components: {
    Restore
  },
  data () {
    return {
      restoreIsVisible: false
    }
  },
  mounted () {
    console.log('🐢 kinopio-client', this.buildHash)
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.restoreIsVisible = false
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
      return Boolean(this.$store.state.cardDetailsIsVisibleForCardId || this.$store.state.multipleCardActionsIsVisible || this.$store.state.connectionDetailsIsVisibleForConnectionId)
    }
  },
  methods: {
    toggleRestoreIsVisible () {
      const isVisible = this.restoreIsVisible
      this.$store.commit('closeAllDialogs')
      this.restoreIsVisible = !isVisible
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
      bottom calc(100% - 8px)
  .undo
    margin 0
    height 11px
</style>
