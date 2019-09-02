<template lang="pug">
dialog.narrow(v-if="visible" :open="visible" ref="dialog" @click.stop)
  section.results-section
    ul.results-list
      template(v-for="(frame in frames")
        li(:class="{ active: frameIsCardFrame(frame.id) }" @click="changeCardFrame(frame)" :key="frame.id")
          .name {{frame.name}}
        //li( }"
        //  .badge(:style="{backgroundColor: type.color}" :class="{checked: connectionTypeIsDefault(type.id)}")
</template>

<script>
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
      const frameId = {
        type: 'frameId',
        value: frame.id,
        cardId: this.card.id
      }
      const frameName = {
        type: 'frameName',
        value: frame.name,
        cardId: this.card.id
      }
      this.$store.commit('currentSpace/updateCardDetails', frameId)
      this.$store.commit('currentSpace/updateCardDetails', frameName)
    },
    frameIsCardFrame (frameId) {
      const cardFrameId = this.card.frameId || 0
      return Boolean(frameId === cardFrameId)
    }
  }
}
</script>

<style lang="stylus" scoped>
section
  padding-top 4px
</style>
