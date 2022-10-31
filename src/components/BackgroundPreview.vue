<template lang="pug">
.background-preview
  //- button
  .preview-button(v-if="isButton")
    .background-tint(:style="backgroundTintStyles")
    button.background-button(:style="backgroundStyles" :class="{ active: buttonIsActive }")
  //- thumbnail
  .preview-wrap(v-else)
    .background-tint(:style="backgroundTintStyles")
    .background-image(:style="backgroundStyles")
</template>

<script>
import backgroundImages from '@/data/backgroundImages.json'
import utils from '@/utils.js'

export default {
  name: 'BackgroundPreview',
  props: {
    isButton: Boolean,
    buttonIsActive: Boolean,
    space: Object
  },
  computed: {
    backgroundTintStyles () {
      const color = this.space.backgroundTint
      if (color) {
        return {
          background: color
        }
      } else {
        return {}
      }
    },
    backgroundStyles () {
      const defaultBackgroundThumbnail = 'https://kinopio-backgrounds.us-east-1.linodeobjects.com/background-thumbnail.svg'
      let background = this.space.background
      const backgroundImage = backgroundImages.find(image => {
        const isImage = image.url === background
        const hasThumbnailUrl = image.thumbnailUrl
        return isImage && hasThumbnailUrl
      })
      if (backgroundImage) {
        background = backgroundImage.thumbnailUrl || background
      }
      if (!utils.urlIsImage(background)) {
        background = defaultBackgroundThumbnail
      }
      return {
        backgroundImage: `url(${background})`
      }
    }
  }
}
</script>

<style lang="stylus">
.background-preview
  display inline-block
  .background-tint
    mix-blend-mode multiply
  .preview-wrap
    height 15px
    width 15px
    position relative
    border-radius 3px
    overflow hidden
    display inline-block
    vertical-align -3px
    z-index 1
  .background-tint
    height 100%
    width 100%
    position absolute
    top 0
    left 0
    mix-blend-mode multiply
    border-radius 3px
  .background-image
    height 100%
    width 100%
    background-size cover
    position absolute
    top 0
    left 0
    mix-blend-mode multiply
  .preview-button
    position relative
    cursor pointer
    &:hover,
    &:active,
    &.active
      background-color var(--primary-background)
      background-size cover
      background-position center
    &:hover
      box-shadow var(--button-hover-shadow)
      background var(--secondary-hover-background)
    &:active
      box-shadow var(--button-active-inset-shadow)
      background var(--secondary-active-background)
    .background-tint
      border-radius 4px
  button
    width 24px
    height 24px
    background-size cover
    background-position center

</style>
