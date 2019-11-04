<template lang="pug">
dialog.narrow.frame-details(v-if="visible" :open="visible" ref="dialog" @click.stop)
  section.results-section
    ul.results-list
      template(v-for="(frame in frames")
        li(:class="{ active: frameIsCardFrame(frame.id) }" @click="changeCardFrame(frame)" :key="frame.id")
          .badge
            img(v-if="isGardenLeaves(frame.id)" src="@/assets/frames/garden-leaves/flower.png")
            img(v-if="isMagicalHelper(frame.id)" src="@/assets/frames/magical-helper/hat.png")
          .name {{frame.name}}
</template>

<script>
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil

import frames from '@/frames.js'

export default {
  props: {
    visible: Boolean,
    card: Object
  },
  computed: {
    frames () {
      return frames
    }
  },
  methods: {
    changeCardFrame (frame) {
      const card = {
        frameId: frame.id,
        frameName: frame.name,
        id: this.card.id
      }
      this.$store.dispatch('currentSpace/updateCard', card)
    },
    frameIsCardFrame (frameId) {
      const cardFrameId = this.card.frameId || 0
      return Boolean(frameId === cardFrameId)
    },
    // frames
    isGardenLeaves (frameId) {
      return Boolean(frameId === 1)
    },
    isMagicalHelper (frameId) {
      return Boolean(frameId === 2)
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      scrollIntoView(element, {
        behavior: 'smooth',
        scrollMode: 'if-needed'
      })
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
    width 17px
    height 19px
    display block
    padding 0
    img
      width 100%
</style>
