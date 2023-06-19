<template lang="pug">
.space-background-image(:style="backgroundStyles" :class="{invert: shouldInvertInDarkTheme}")
.space-background-tint(v-if="visible" :style="{ background: backgroundTint }")
</template>

<script>
import utils from '@/utils.js'
import backgroundImages from '@/data/backgroundImages.json'
import postMessage from '@/postMessage.js'

import { colord, extend } from 'colord'

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
    visible () {
      const isAddPage = this.$store.state.isAddPage
      return !isAddPage
    },
    currentSpace () { return this.$store.state.currentSpace },
    backgroundStyles () {
      const styles = {
        backgroundImage: `url('${this.imageUrl}')`,
        backgroundSize: this.size,
        transform: this.$store.getters.zoomTransform
      }
      return styles
    },
    background () {
      const defaultBackground = 'https://kinopio-backgrounds.us-east-1.linodeobjects.com/default-background-2x.png'
      return this.currentSpace.background || defaultBackground
    },
    backgroundTint () {
      let color = this.currentSpace.backgroundTint || 'white'
      let darkness = 0
      if (this.shouldDarkenTint) {
        darkness = 0.2
      }
      color = colord(color).darken(darkness).toRgbString()
      postMessage.send({ name: 'setBackgroundTintColor', value: color })
      return color
    },
    isThemeDark () { return this.$store.state.currentUser.theme === 'dark' },
    kinopioBackgroundImageData () {
      const data = backgroundImages.find(image => image.url === this.currentSpace.background)
      return data
    },
    backgroundIsDefault () {
      return !this.currentSpace.background
    },
    spaceBackgroundTintIsDark () {
      return utils.colorIsDark(this.backgroundTint)
    },
    shouldDarkenTint () {
      return this.isThemeDark && !this.spaceBackgroundTintIsDark
    },
    shouldInvertInDarkTheme () {
      if (!this.isThemeDark) { return }
      if (this.backgroundIsDefault) { return }
      const data = this.kinopioBackgroundImageData
      if (!data) { return }
      return data.shouldInvertInDarkTheme
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
.space-background-image
  position absolute
  width 100%
  height 100%
  pointer-events none
  z-index 0
  transform-origin top left
  background var(--primary-background)
  &.invert
    filter invert()

.space-background-tint
  position absolute
  width 110%
  height 110%
  pointer-events none
  z-index 0
  mix-blend-mode multiply
  transform-origin top left
</style>
