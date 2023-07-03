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
      if (mutation.type === 'triggerUpdateBackground') {
        this.updateBackground()
      } else if (mutation.type === 'triggerUpdateTheme') {
        this.updateBackground()
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
      let data = this.kinopioBackgroundImageData
      let url
      // darkUrl
      if (data && this.isThemeDark) {
        url = data.darkUrl || data.url
      // url
      } else if (data) {
        url = data.url
      } else {
        url = this.currentSpace.background
      }
      return url
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
      const data = backgroundImages.find(image => {
        const background = this.currentSpace.background
        if (!background) {
          return image.isDefault
        }
        return background === image.url
      })
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
    async updateBackground () {
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
          console.warn('🚑 updateBackground', background, error)
        }
      }
    },
    updateBackgroundSize () {
      let backgroundImage = this.imageUrl
      backgroundImage = utils.urlFromCSSBackgroundImage(backgroundImage)
      let image = new Image()
      image.src = backgroundImage
      let isRetina = backgroundImage.includes('-2x.') || backgroundImage.includes('@2x.')
      let width = image.width
      let height = image.height
      if (isRetina) {
        width = width / 2
        height = height / 2
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
