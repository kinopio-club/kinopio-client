<template lang="pug">
dialog.narrow.frame-details(v-if="visible" :open="visible" ref="dialog" @click.left.stop)
  section.results-section
    ul.results-list
      template(v-for="(frame in frames")
        li(:class="{active: frameIsSelected(frame)}" @click.left="changeCardFrame(frame)" :key="frame.id" tabindex="0" v-on:keyup.enter="changeCardFrame(frame)")
          .badge
            template(v-if="frameHasBadge(frame)")
              img(:src="frameBadge(frame).path")
          .name {{frame.name}}
</template>

<script>
import scrollIntoView from '@/scroll-into-view.js'
import frames from '@/data/frames.js'

export default {
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
        this.$store.dispatch('currentSpace/updateCard', card)
      })
    },
    frameIsSelected (frame) {
      const cardFrameIds = this.cards.map(card => card.frameId)
      return cardFrameIds.includes(frame.id)
    },
    frameHasBadge (frame) {
      return Boolean(frame.badge)
    },
    frameBadge (frame) {
      return {
        path: require(`@/assets/frames/${frame.badge}`)
      }
    },
    scrollIntoView () {
      const element = this.$refs.dialog
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
      vertical-align -5px
</style>
