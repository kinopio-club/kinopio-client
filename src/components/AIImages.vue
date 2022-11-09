<template lang="pug">
.ai-images(v-if="visible" @click.stop="clear")
  section.results-section(ref="section" :style="{'max-height': height + 'px'}")
    ul.results-list.image-list
      template(v-for="image in AIImages")
        li
          div
            img(:src="image.url" @click.stop="toggleSelectedImage(image)" :class="{ active: isSelectedImage(image) }")
            //- prompt
            p.prompt(v-if="isSelectedImage(image)")
              img.icon.openai(src="@/assets/openai.svg")
              span {{image.prompt}}
              //- copy prompt
              .input-button-wrap.copy-prompt(@click.stop="copyPrompt($event, image.prompt)")
                button.small-button
                  img.icon.copy(src="@/assets/copy.svg")
          //- copy url
          .input-button-wrap.copy-image-url(@click.stop="copyUrl($event, image.url)")
            button.small-button
              img.icon.copy(src="@/assets/copy.svg")

</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'AIImages',
  props: {
    visible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateHeight()
      }
    })
  },
  data () {
    return {
      height: null,
      selectedAIImage: {}
    }
  },
  computed: {
    AIImages () {
      return this.$store.state.currentUser.AIImages
    }
  },
  methods: {
    isSelectedImage (image) {
      return this.selectedAIImage.url === image.url
    },
    clear () {
      this.selectedAIImage = {}
    },
    updateHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.section
        this.height = utils.elementHeight(element, true)
      })
    },
    copyUrl (event, url) {
      console.log('💖', event, url)
      event.target.blur()
    },
    copyPrompt (event, prompt) {
      console.log('🔥', event, prompt)
      event.target.blur()
    },
    toggleSelectedImage (image) {
      if (image.url === this.selectedAIImage.url) {
        this.clear()
      } else {
        console.log('🌷', image)
        this.selectedAIImage = image
      }
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.clear()
        this.updateHeight()
      }
    }
  }
}
</script>

<style lang="stylus">
.ai-images
  overflow auto
  border-top 1px solid var(--primary)
  .prompt-row
    align-items flex-start
    user-select text
  ul.results-list.image-list
    .copy-image-url
      padding-right 4px
    .copy-prompt
      padding-right 0
      margin-right -4px
      padding-top 0
    .small-button
      position static
      width 25px
      .icon
        min-height initial
    li
      .prompt
        position relative
        margin-top 0
        span
          margin-left 3px
      .openai
        width 16px
        vertical-align -3px
        min-height initial

</style>
