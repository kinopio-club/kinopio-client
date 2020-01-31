<template lang="pug">
footer(v-if="!dialogsVisible")
  Notifications
  section
    .button-wrap
      button(@click="toggleCommunityIsVisible" :class="{ active: communityIsVisible}")
        span Community Spaces
      Community(:visible="communityIsVisible")

  section.controls
    .button-wrap(v-if="userCanEditCurrentSpace")
      button(@click="toggleRemovedIsVisible" :class="{ active: removedIsVisible}")
        img.refresh.icon(src="@/assets/remove.svg")
        span Removed
      Removed(:visible="removedIsVisible")

    .button-wrap
      button(@click="toggleFiltersIsVisible" :class="{ active: filtersIsVisible}")
        .span.badge.info(v-if="totalFilters") {{totalFilters}}
        img.icon.sunglasses(src="@/assets/filter.svg")
        span Filters
      Filters(:visible="filtersIsVisible")

    .button-wrap(v-if="isOffline")
      button(@click="toggleOfflineIsVisible" :class="{ active: offlineIsVisible}")
        span Offline
      Offline(:visible="offlineIsVisible")

</template>

<script>
import Community from '@/components/dialogs/Community.vue'
import Removed from '@/components/dialogs/Removed.vue'
import Offline from '@/components/dialogs/Offline.vue'
import Filters from '@/components/dialogs/Filters.vue'
import Notifications from '@/components/Notifications.vue'

export default {
  name: 'Footer',
  components: {
    Community,
    Removed,
    Offline,
    Notifications,
    Filters
  },
  data () {
    return {
      removedIsVisible: false,
      offlineIsVisible: false,
      filtersIsVisible: false,
      communityIsVisible: false
    }
  },
  mounted () {
    console.log('🐢 kinopio-client', this.buildHash) // TODO move this stuff to store init, or app?
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.removedIsVisible = false
        this.offlineIsVisible = false
        this.filtersIsVisible = false
        this.communityIsVisible = false
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
    },
    userCanEditCurrentSpace () {
      return this.$store.getters['currentUser/canEditCurrentSpace']
    }

  },
  methods: {
    toggleRemovedIsVisible () {
      const isVisible = this.removedIsVisible
      this.$store.commit('closeAllDialogs')
      this.removedIsVisible = !isVisible
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
    },
    toggleCommunityIsVisible () {
      const isVisible = this.communityIsVisible
      this.$store.commit('closeAllDialogs')
      this.communityIsVisible = !isVisible
    }
  }
}
</script>

<style lang="stylus">
footer
  z-index var(--max-z)
  position fixed
  left 8px
  bottom 8px
  pointer-events none
  max-width calc(100% - 17px)
  .undo
    margin 0
    height 11px
  .controls
    margin-top 6px
  > section
    display flex
    > .button-wrap
      pointer-events all
      margin-left 6px
      display inline-block
      dialog
        top initial
        bottom calc(100% - 8px)
  .sunglasses
    vertical-align middle
</style>
