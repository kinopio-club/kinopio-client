<template lang="pug">
.overlay-background(v-if="isVisible" :style="overlayBackgroundStyle")
//- .minimap(v-if="isVisible")
//-   p blank template, please duplicate
</template>

<script>
export default {
  name: 'ComponentName',
  components: {
  },
  created () {
  //   this.$store.subscribe((mutation, state) => {
  //     if (mutation.type === 'closeAllDialogs') {
  //       this.closeAllDialogs()
  //     }
  //   })
  },
  mounted () {
    this.update()
  },
  data () {
    return {
      // cards: [],
      // map: {},
      // viewport: {},
      // cursorPosition: {},
    }
  },
  computed: {
    isVisible () { return this.$store.state.minimapIsVisible },
    overlayBackgroundStyle () {
      const backgroundColor = this.$store.state.currentSpace.backgroundTint
      return { backgroundColor }
    }
  },
  methods: {
    update () {
      console.log('🍅 update minimap')
    }
  },
  watch: {
    isVisible (value) {
      if (value) {
        this.update()
      }
    }
  }
}
</script>

<style lang="stylus">
.overlay-background
  position fixed
  top 0
  left 0
  width 100vw
  height 100vh
  background-color var(--primary-background)
  opacity 0.6
</style>
