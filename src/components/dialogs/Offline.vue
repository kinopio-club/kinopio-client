<template lang="pug">
dialog(v-if="visible" :open="visible")
  section
    p Offline
  section
    p Kinopio works offline,
    p Your changes will be saved locally, and synced up once you're back online. It's pretty chill.
    p
      span.badge.info {{queue.length}} {{pluralChanges}} to sync

</template>

<script>
import cache from '@/cache.js'
import utils from '@/utils.js'

export default {
  name: 'Offline',
  props: {
    visible: Boolean
  },
  computed: {
    queue () {
      return cache.queue()
    },
    pluralChanges () {
      const condition = this.queue.length !== 1
      return utils.pluralize('change', condition)
    }
  }
}
</script>

<style lang="stylus">
</style>
