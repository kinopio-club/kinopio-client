<template lang="pug">
.card-embed(v-if="visible" :style="{'height': heightFromWidth}")
  iframe(allowfullscreen :src="url" :class="{'info-is-visible': !shouldHideInfo}")
</template>

<script>
export default {
  name: 'CardEmbed',
  props: {
    visible: Boolean,
    url: String,
    card: Object
  },
  computed: {
    heightFromWidth () {
      const width = this.card.width
      const aspectRatio = 9 / 16
      const height = Math.round(width * aspectRatio)
      return height + 'px'
    }
  }
}
</script>

<style lang="stylus">
.card-embed
  width 100%
  iframe
    border none
    border-radius var(--small-entity-radius)
    max-width 100%
    width 100%
    height 100%
    &.info-is-visible
      border-bottom-left-radius 0
      border-bottom-right-radius 0

</style>
