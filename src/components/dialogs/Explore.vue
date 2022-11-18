<template lang="pug">
dialog.explore(v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  Community(:visible="true" :loading="loading" :spaces="spaces" :userShowInExploreDate="comparisonDate")
</template>

<script>
import Community from '@/components/Community.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

export default {
  name: 'Explore',
  components: {
    Loader,
    Community
  },
  props: {
    visible: Boolean,
    preloadedSpaces: Object
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      }
    })
  },
  data () {
    return {
      loading: false,
      spaces: [],
      newSpaces: [],
      dialogHeight: null,
      comparisonDate: null
    }
  },
  methods: {
    async updateSpaces () {
      if (this.loading) { return }
      this.loading = true
      if (!this.spaces.length) {
        this.spaces = this.preloadedSpaces || []
      }
      this.spaces = await this.$store.dispatch('api/getExploreSpaces')
      this.newSpaces = this.spaces
      this.loading = false
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeightFromHeader(element)
      })
    },
    async updateUserShowInExploreUpdatedAt () {
      this.comparisonDate = this.$store.state.currentUser.showInExploreUpdatedAt
      let serverDate = await this.$store.dispatch('api/getDate')
      serverDate = serverDate.date
      this.$store.dispatch('currentUser/showInExploreUpdatedAt', serverDate)
    }
  },
  watch: {
    visible (visible) {
      this.$store.commit('clearNotificationsWithPosition')
      if (visible) {
        this.updateSpaces()
        this.updateDialogHeight()
        this.updateUserShowInExploreUpdatedAt()
      }
    }
  }
}
</script>

<style lang="stylus">
.explore
  max-height calc(100vh - 100px)
</style>
