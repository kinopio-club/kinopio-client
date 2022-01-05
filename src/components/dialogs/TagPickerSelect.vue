<template lang="pug">
dialog.narrow.tag-picker-select(v-if="visible" :open="visible" ref="dialog" @click.left.stop)
  section
    p yolo taglist
  //- section.results-section
  //-   ul.results-list
  //-     template(v-for="frame in frames" :key="frame.id")
  //-       li(:class="{active: frameIsSelected(frame)}" @click.left="changeCardFrame(frame)" tabindex="0" v-on:keyup.enter="changeCardFrame(frame)")
  //-         FrameBadge(:frame="frame")
  //-         .name {{frame.name}}
</template>

<script>
import scrollIntoView from '@/scroll-into-view.js'

export default {
  name: 'TagPickerSelectOnly',
  // components: {
  // FrameBadge
  // },
  props: {
    visible: Boolean,
    cards: Array
  },
  // computed: {
  //   frames () {
  //     return frames
  //   }
  // },
  methods: {
    // changeCardFrame (frame) {
    //   this.cards.forEach(card => {
    //     card = {
    //       frameId: frame.id,
    //       frameName: frame.name,
    //       id: card.id
    //     }
    //     this.$store.dispatch('currentCards/update', card)
    //   })
    // },
    // frameIsSelected (frame) {
    //   const cardFrameIds = this.cards.map(card => card.frameId)
    //   return cardFrameIds.includes(frame.id)
    // },
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
</style>
