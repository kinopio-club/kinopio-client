<template lang="pug">
.space-zoom
  Slider(
    @updatePlayhead="updateZoomFromSlider"
    :minValue="min"
    :value="spaceZoomPercent"
    :maxValue="initialValue"
    :initialValue="initialValue"
    :animateJiggleRight="animateJiggleRight"
    :animateJiggleLeft="animateJiggleLeft"
    minLabel="(Z)"
    @removeAnimations="removeAnimations"
    @pointerdown="closeAllDialogs"
  )
</template>

<script>
import Slider from '@/components/Slider.vue'
import utils from '@/utils.js'

const increment = 10
let touchStartZoomValue

export default {
  name: 'SpaceZoom',
  components: {
    Slider
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      const { type, payload } = mutation
      if (type === 'triggerSpaceZoomReset') {
        this.updateZoom(this.initialValue)
        window.scrollTo(0, 0)
      } else if (type === 'triggerSpaceZoomOut') {
        let percent = this.spaceZoomPercent
        let speed
        if (payload) {
          speed = payload.speed
        }
        percent -= speed || increment
        this.updateZoom(percent)
      } else if (type === 'triggerSpaceZoomIn') {
        let percent = this.spaceZoomPercent
        let speed
        if (payload) {
          speed = payload.speed
        }
        percent += speed || increment
        this.updateZoom(percent)
      } else if (type === 'triggerToggleZoomOut') {
        let value = this.initialValue
        if (this.spaceZoomPercent !== this.min) {
          value = this.min
        }
        this.$store.commit('spaceZoomPercent', value)
      }
    })
  },
  mounted () {
    window.addEventListener('touchmove', this.pinchZoom)
    window.addEventListener('touchstart', this.initPinchZoom)
    window.addEventListener('wheel', this.mouseWheelZoom, { passive: false })
  },
  beforeUnmount () {
    window.removeEventListener('touchmove', this.pinchZoom)
    window.addEventListener('touchstart', this.initPinchZoom)
    window.removeEventListener('wheel', this.mouseWheelZoom, { passive: false })
  },
  data () {
    return {
      min: 40,
      max: 100,
      initialValue: 100,
      animateJiggleRight: false,
      animateJiggleLeft: false
    }
  },
  computed: {
    spaceZoomPercent () { return this.$store.state.spaceZoomPercent }
  },
  methods: {
    removeAnimations () {
      this.animateJiggleRight = false
      this.animateJiggleLeft = false
    },
    closeAllDialogs () {
      this.$store.dispatch('clearMultipleSelected')
      this.$store.dispatch('closeAllDialogs', 'SpaceZoom')
    },

    // mouse wheel zoom

    mouseWheelZoom (event) {
      const isMeta = event.metaKey || event.ctrlKey // event.ctrlKey is true for mac safari trackpad pinch
      if (!isMeta) { return }
      event.preventDefault()
      const deltaY = event.deltaY
      let shouldZoomIn = deltaY < 0
      let speed = Math.min(Math.abs(deltaY), 5)
      speed = speed * 1.5
      const position = utils.cursorPositionInPage(event)
      this.$store.commit('prevZoomOrigin', position)
      // let percent = this.spaceZoomPercent
      // let speed
      // if (payload) {
      //   speed = payload.speed
      // }
      // percent += speed || increment
      if (shouldZoomIn) {
        this.$store.commit('triggerSpaceZoomIn', { speed })
      } else {
        this.$store.commit('triggerSpaceZoomOut', { speed })
      }
    },

    // pinch zoom

    initPinchZoom () {
      touchStartZoomValue = this.spaceZoomPercent
    },
    pinchZoom (event) {
      const isPinching = event.touches.length === 2
      if (!isPinching) { return }
      const position = utils.cursorPositionInPage(event)
      this.$store.commit('prevZoomOrigin', position)
      const percent = event.scale * touchStartZoomValue
      this.updateZoom(percent)
    },

    // update zoom

    updateZoom (percent) {
      if (percent > this.max) {
        this.animateJiggleRight = true
      } else if (percent < this.min) {
        this.animateJiggleLeft = true
      }
      percent = Math.max(percent, this.min)
      percent = Math.min(percent, this.max)
      this.$store.commit('spaceZoomPercent', percent)
    },
    updateZoomFromSlider (percent) {
      percent = percent / 100
      percent = Math.round(this.min + (this.max - this.min) * percent)
      this.$store.commit('spaceZoomPercent', percent)
    }
  }
}
</script>

<style lang="stylus">
.space-zoom
  display block
  width 100px
</style>
