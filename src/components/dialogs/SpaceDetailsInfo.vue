<template lang="pug">
dialog.narrow(v-if="visible" :open="visible" @click.left="closeDialogs" ref="dialog")
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
      this.$store.commit('triggerSpaceDetailsCloseDialogs')
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
