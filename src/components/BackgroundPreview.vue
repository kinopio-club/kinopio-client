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
  // data () {
  //   return {
  //     backgroundTint: ''
  //   }
  // },
  // created () {
  //   this.$store.subscribe((mutation, state) => {
  //     if (mutation.type === 'triggerUpdateBackgroundTint') {
  //       this.updateBackgroundTint()
  //     }
  //   })
  // },

  computed: {
    backgroundTint () { return this.space.backgroundTint },
    backgroundTintStyles () {
      if (this.backgroundTint) {
        return {
          background: this.backgroundTint,
          mixBlendMode: 'multiply'
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

  },
  methods: {
    // toggleBackground () {
    //   this.$emit('toggleBackground')
    // }
    // updateBackgroundTint () {
    //   let color = this.currentSpace.backgroundTint
    //   this.backgroundTint = color
    // }
  }
}
</script>

<style lang="stylus">
.background-preview
  display inline-block
  .preview-wrap
    height 24px
    width 24px
    position relative
    border-radius 3px
    overflow hidden
    display inline-block
    .background-tint
      height 100%
      width 100%
      top 0
      left 0
    .background-image
      height 100%
      width 100%
      background-size cover

</style>
