<template lang="pug">
dialog.narrow.frame-details(v-if="visible" :open="visible" ref="dialog" @click.left.stop)
  section.results-section
    ul.results-list
      template(v-for="frame in frames" :key="frame.id")
        li(:class="{active: frameIsSelected(frame)}" @click.left="changeCardFrame(frame)" tabindex="0" v-on:keyup.enter="changeCardFrame(frame)")
          FrameBadge(:frame="frame")
          .name {{frame.name}}
</template>

<script>
import frames from '@/data/frames.js'
import FrameBadge from '@/components/FrameBadge.vue'
import utils from '@/utils.js'

export default {
  name: 'FramePicker',
  components: {
    FrameBadge
  },
  props: {
    visible: Boolean,
    cards: Array
  },
  computed: {
    frames () {
      return frames
    }
  },
  methods: {
    changeCardFrame (frame) {
      this.cards.forEach(card => {
        card = {
          frameId: frame.id,
          frameName: frame.name,
          id: card.id
        }
        this.$store.dispatch('currentCards/update', card)
      })
    },
    frameIsSelected (frame) {
      const cardFrameIds = this.cards.map(card => card.frameId)
      return cardFrameIds.includes(frame.id)
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      utils.scrollIntoView({ element })
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
.frame-details
  section
    padding-top 4px
  .badge
    width 20px
    height 19px
    display block
    padding 0
    img
      width 100%
      vertical-align -5px
</style>
