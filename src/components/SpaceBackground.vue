<template lang="pug">
.space-background(:style="backgroundStyles")
  .space-background-tint(v-if="isSpace" :style="backgroundTintStyles")
</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'SpaceBackground',
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerLoadBackground') {
        this.loadBackground()
      }
    })
  },
  data () {
    return {
      imageUrl: '',
      size: 'initial'
    }
  },
  computed: {
    isSpace () {
      const isAddPage = this.$store.state.isAddPage
      return !isAddPage
    },
    currentSpace () { return this.$store.state.currentSpace },
    backgroundTintStyles () {
      return {
        background: this.backgroundTint
      }
    },
    backgroundStyles () {
      const transform = this.$store.getters.transformZoom
      const styles = {
        backgroundImage: `url('${this.imageUrl}')`,
        backgroundSize: this.size,
        transform: transform
      }
      return styles
    },
    background () {
      const defaultBackground = 'https://kinopio-backgrounds.us-east-1.linodeobjects.com/default-background-2x.png'
      return this.currentSpace.background || defaultBackground
    },
    backgroundTint () {
      const color = this.currentSpace.backgroundTint
      const metaThemeColor = document.querySelector('meta[name=theme-color]')
      metaThemeColor.setAttribute('content', color)
      return color
    }
  },
  methods: {
    async loadBackground () {
      const background = this.background
      if (!utils.urlIsImage(background)) {
        this.imageUrl = ''
        this.updateBackgroundSize()
      }
      try {
        const image = await utils.loadImage(background)
        if (image) {
          this.imageUrl = background
          this.updateBackgroundSize()
        }
      } catch (error) {
        if (background) {
          console.warn('🚑 loadBackground', background, error)
        }
      }
    },
    updateBackgroundSize () {
      const defaultSize = {
        width: 310,
        height: 200
      }
      let backgroundImage = this.imageUrl
      backgroundImage = utils.urlFromCSSBackgroundImage(backgroundImage)
      let isRetina
      let image = new Image()
      let width, height
      if (backgroundImage) {
        isRetina = backgroundImage.includes('-2x.') || backgroundImage.includes('@2x.')
        image.src = backgroundImage
        width = image.width
        height = image.height
        if (isRetina) {
          width = width / 2
          height = height / 2
        }
      } else {
        width = defaultSize.width
        height = defaultSize.height
      }
      if (width === 0 || height === 0) {
        this.size = 'initial'
        return
      }
      width = Math.round(width)
      height = Math.round(height)
      this.size = `${width}px ${height}px`
    }
  }
}
</script>

<style lang="stylus">
.space-background-tint
  position absolute
  width 100%
  height 100%
  pointer-events none
  z-index 0
  mix-blend-mode multiply
  transform-origin top left
.space-background
  position absolute
  width 100%
  height 100%
  pointer-events none
  z-index 0
  transform-origin top left
  background var(--primary-background)
</style>
