<template lang="pug">
dialog.narrow.offline(v-if="visible" :open="visible" ref="dialog" :class="{'right-side': showOnRightSide}")
  section
    p Offline
  section(v-if="currentUserIsSignedIn")
    p Kinopio works offline,
    p Your changes will be saved locally, and synced up once you're back online. It's pretty chill.
    p
      span.badge.info {{queue.length}} {{pluralChanges}} to sync
  section(v-else)
    p Kinopio works offline,
    p Your changes are saved locally. It's pretty chill.

</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'Offline',
  props: {
    visible: Boolean
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
        this.queue = this.$store.getters['cache/queue']
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
</style>
