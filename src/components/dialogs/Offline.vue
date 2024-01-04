<template lang="pug">
dialog.narrow.offline(v-if="visible" :open="visible" ref="dialog" :class="{'right-side': showOnRightSide}")
  section
    p Offline
  section(v-if="currentUserIsSignedIn")
    p Kinopio works offline,
    p Your changes will be saved locally, and sync-ed up once you're back online.
    p
      span.badge.info
        Loader(:visible="true" :isSmall="true" :isStatic="true")
        span {{queue.length}} {{pluralChanges}} to sync
  section(v-else)
    p Kinopio works offline,
    p Your changes are saved locally.

</template>

<script>
import cache from '@/cache.js'
import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'

export default {
  name: 'Offline',
  props: {
    visible: Boolean
  },
  components: {
    Loader
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.checkIfShouldBeOnRightSide()
      }
    })
  },
  data () {
    return {
      queue: [],
      showOnRightSide: false
    }
  },
  computed: {
    pluralChanges () {
      const condition = this.queue.length !== 1
      return utils.pluralize('change', condition)
    },
    currentUserIsSignedIn () {
      return Boolean(this.$store.getters['currentUser/isSignedIn'])
    }
  },
  methods: {
    checkIfShouldBeOnRightSide () {
      this.showOnRightSide = false
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.showOnRightSide = utils.elementShouldBeOnRightSide(element)
      })
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.queue = cache.queue()
        this.checkIfShouldBeOnRightSide()
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
.offline
  &.right-side
    left initial
    right 8px
  .loader
    vertical-align -2px
</style>
