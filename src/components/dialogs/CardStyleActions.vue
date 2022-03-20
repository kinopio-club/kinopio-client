<template lang="pug">
dialog.card-style-actions(v-if="visible" :open="visible" ref="dialog" :style="styles")
  CardStyleActionsComponent(:visible="true" :cards="cards")
</template>

<script>
import CardStyleActionsComponent from '@/components/CardStyleActions.vue'
import scrollIntoView from '@/scroll-into-view.js'

export default {
  name: 'CardStyleActions',
  components: {
    CardStyleActionsComponent
  },
  props: {
    visible: Boolean,
    backgroundColor: String,
    cards: Array
  },
  computed: {
    styles () {
      return {
        backgroundColor: this.backgroundColor
      }
    }
  },
  methods: {
    scrollIntoView () {
      const element = this.$refs.dialog
      if (!element) { return }
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.scrollIntoView()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
.card-style-actions
  background-color var(--secondary-background)
  left -138px
</style>
