<template lang="pug">
.card#id1(style={top: '80px', left: '80px'})
  p hello {{ msg }} and math time
  .connector(
    :style="testcolor"
    @mousedown="startConnecting"
    @touchstart="startConnecting"
  ) O
</template>

<script>
import randomcolor from 'randomcolor'

export default {
  name: 'Card',
  props: {
    id: Number,
    name: String
  },
  created () {
    this.color = randomcolor({ luminosity: 'light' })
  },
  data () {
    return {
      color: undefined
    }
  },

  // a value that updates when anything in it gets updated,
  // use this whenever you want to filter or transform Data
  computed: {
    // yolo () {
    //   return this.$store.state.lollipops
    // },
    testcolor () {
      return { background: this.color }
    }
  },

  // a function bound to the component, only run when explicitly called
  // re-evaluated each time it's called
  // https://stackoverflow.com/questions/44350862/method-vs-computed-in-vue
  methods: {
    startConnecting () {
      this.$store.commit('currentUserIsDrawingConnection', true)
      this.$store.commit('drawingConnectionOrigin', event.srcElement.getBoundingClientRect())
    }
  }
}
</script>

<style lang="stylus">
.space
  position absolute
  top 0
  left 0
  width: 100%
  height: 100%
  pointer-events none
.card
  user-select: none
  display flex
  pointer-events all
  background-color var(--secondary-background)
  position absolute
  max-width 235px
  cursor pointer
  > p
    align-self stretch
    margin 8px
  .connector
    background-color pink
    padding 8px
    align-self right
    cursor cell
</style>
