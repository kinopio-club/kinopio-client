<template lang="pug">
.select-all-below
  //- .tick.small(:style="{ 'background-color': userColor }")
  //- .tick(:style="{ 'background-color': userColor }")

  .badge.label-badge.button-badge(:style="{ 'background-color': userColor }")
    img(src="@/assets/brush-y.svg")

  //- .tick(:style="{ 'background-color': userColor }")
  //- .tick.small(:style="{ 'background-color': userColor }")
</template>

<script>
// import utils from '@/utils.js'

export default {
  name: 'SelectAllBelow',
  computed: {
    userColor () { return this.$store.state.currentUser.color }
  },
  method: {
  }
}
</script>

<style lang="stylus">
.select-all-below
  position fixed
  left 0
  top 250px
  pointer-events all
  cursor pointer
  .badge
    border-radius 0
    border-top-right-radius 6px
    border-bottom-right-radius 6px
    padding 0
    margin 0
    position initial
    box-shadow none
    margin-bottom 8px

  img
    // filter invert(100%)
    padding 3px
    margin-left 6px
    margin-right 8px

  // todo unused?
  .tick
    background-color var(--primary)
    height 1px
    width 12px
    margin-bottom 8px
    &.small
      width 6px
      margin-bottom 12px
</style>
