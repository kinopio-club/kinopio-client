<template lang="pug">
footer(v-if="!dialogsVisible")
  Notifications
  section.controls
    .button-wrap
      button(@click="toggleRestoreIsVisible" :class="{ active: restoreIsVisible}")
        img.refresh.icon(src="@/assets/undo.svg")
      Restore(:visible="restoreIsVisible")

    .button-wrap
      button(@click="toggleFiltersIsVisible" :class="{ active: filtersIsVisible}")
        .span.badge.info(v-if="totalFilters") {{totalFilters}}
        img.icon(src="@/assets/sunglasses.svg")
        span Filters
      Filters(:visible="filtersIsVisible")

    .button-wrap(v-if="isOffline")
      button(@click="toggleOfflineIsVisible" :class="{ active: offlineIsVisible}")
        span Offline
      Offline(:visible="offlineIsVisible")

</template>

<script>
import Restore from '@/components/dialogs/Restore.vue'
import Offline from '@/components/dialogs/Offline.vue'
import Filters from '@/components/dialogs/Filters.vue'
import Notifications from '@/components/Notifications.vue'

export default {
  name: 'Footer',
  components: {
    Restore,
    Offline,
    Notifications,
    Filters
  },
  data () {
    return {
      restoreIsVisible: false,
      offlineIsVisible: false,
      filtersIsVisible: false
    }
  },
  mounted () {
    console.log('🐢 kinopio-client', this.buildHash) // TODO move this stuff to store init, or app?
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.restoreIsVisible = false
        this.offlineIsVisible = false
        this.filtersIsVisible = false
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
      return Boolean(this.$store.state.cardDetailsIsVisibleForCardId || this.$store.state.multipleSelectedActionsIsVisible || this.$store.state.connectionDetailsIsVisibleForConnectionId)
    },
    isOffline () {
      return !this.$store.state.isOnline
    },
    totalFilters () {
      const types = this.$store.state.filteredConnectionTypeIds
      const frames = this.$store.state.filteredFrameIds
      return types.length + frames.length
    }
  },
  methods: {
    toggleRestoreIsVisible () {
      const isVisible = this.restoreIsVisible
      this.$store.commit('closeAllDialogs')
      this.restoreIsVisible = !isVisible
    },
    toggleOfflineIsVisible () {
      const isVisible = this.offlineIsVisible
      this.$store.commit('closeAllDialogs')
      this.offlineIsVisible = !isVisible
    },
    toggleFiltersIsVisible () {
      const isVisible = this.filtersIsVisible
      this.$store.commit('closeAllDialogs')
      this.filtersIsVisible = !isVisible
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
  max-width calc(100% - 17px)
  .undo
    margin 0
    height 11px
  .controls
    display flex
    flex-direction row-reverse // prevents shifting when notifications displayed
    > .button-wrap
      pointer-events all
      margin-left 6px
      display inline-block
      dialog
        left initial
        right 8px
        top initial
        bottom calc(100% - 8px)
  // button
  //   .badge
  //     margin 0
  //     margin-left 6px
</style>
