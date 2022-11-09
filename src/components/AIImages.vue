<template lang="pug">
.ai-images(v-if="visible")
  section(ref="section" :style="{'max-height': height + 'px'}")
    //- p ai images go here, grouped by prompt, in img picker style 2-col grid
    //- p or is prompt only revealed on img click?
    //- p img action is small btn 'copy' (w notification 'copied url')
    template(v-for="AIImage in AIImagesGroupedByPrompt")
      p
        img.icon.openai(src="@/assets/openai.svg")
        span {{prompt(AIImage)}}
      ul.results-list.image-list
        template(v-for="image in images(AIImage)")
          //- :key="image.id"
          li
            //- (@click.left="selectImage(image)" tabindex="0" v-on:keydown.enter="selectImage(image)" :class="{ active: isCardUrl(image)}")
            img(:src="image.url")
            //- a(v-if="image.sourcePageUrl" :href="image.sourcePageUrl" target="_blank" @click.left.stop)
            button.small-button
              //-     span(v-if="image.sourceName") {{image.sourceName}}{{' '}}
              img.icon.cut(src="@/assets/cut.svg")

</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'AIImages',
  components: {
  },
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
  // mounted () {
  //   console.log('🍋🍋🍋',this.$store.getters['currentUser/AIImagesGroupedByPrompt'])
  // },
  // beforeUnmount () {
  // },
  data () {
    return {
      height: null
    }
  },
  computed: {
    AIImagesGroupedByPrompt () {
      return this.$store.getters['currentUser/AIImagesGroupedByPrompt']
    }
  },
  methods: {
    prompt (AIImage) {
      return AIImage[0].prompt
    },
    images (AIImage) {
      return Object.values(AIImage)
    },
    updateHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.section
        this.height = utils.elementHeight(element, true)
      })
    }

  },
  watch: {
    visible (visible) {
      if (visible) {
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
  .openai
    width 16px
    vertical-align -3px
  ul.image-list
    .small-button
      top 10px
    .icon
      min-height initial
      vertical-align 1px
</style>
