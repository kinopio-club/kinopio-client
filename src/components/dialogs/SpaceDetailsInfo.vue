<template lang="pug">
dialog(v-if="visible" :open="visible" @click.left="closeDialogs" ref="dialog")
  section
    SpaceDetailsInfo(:shouldHidePin="true" @closeDialogs="closeDialogs")
</template>

<script>
import SpaceDetailsInfo from '@/components/SpaceDetailsInfo.vue'

export default {
  name: 'SpaceDetailsInfoDialog',
  components: {
    SpaceDetailsInfo
  },
  props: {
    visible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerSpaceDetailsInfoIsVisible') {
        this.$nextTick(() => {
          this.$store.commit('triggerFocusSpaceDetailsName')
        })
      }
    })
  },
  methods: {
    closeDialogs () {
      this.$store.commit('triggerCloseChildDialogs')
    }
  },
  watch: {
    visible (visible) {
      this.$store.commit('clearNotificationsWithPosition')
    }
  }
}
</script>
<style lang="stylus">
</style>
