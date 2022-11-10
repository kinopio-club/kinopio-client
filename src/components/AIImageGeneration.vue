<template lang="pug">
.ai-image-generation(v-if="visible")
  //- sign up
  section(v-if="!currentUserIsSignedIn")
    section.subsection
      p Because of the cost of generating AI images, you'll need to sign in or up to use this
      .button-wrap
        button(@click.left="triggerSignUpOrInIsVisible")
          span Sign Up or In

  section.results-section.search-input-wrap
    //- prompt textarea
    template(v-if="currentUserIsSignedIn")
      .search-wrap
        img.icon.openai(v-if="!loading" src="@/assets/openai.svg" @click.left="focusPromptInput")
        Loader(:visible="loading")
        textarea(
          placeholder="Puppies in a victorian style"
          v-model="promptInput"
          ref="promptInput"
          @focus="resetPinchCounterZoomDecimal"
          @update="textareaSize"
          @keydown.enter.exact.prevent="generateImage"
          @keyup.stop.backspace
          @keyup.stop.enter
          @mouseup.stop
          @touchend.stop
          rows="1"
          :maxlength="400"
        )
        button.borderless.clear-input-wrap(@click.left="clear")
          img.icon.cancel(src="@/assets/add.svg")
      .button-wrap
        button.button-generate(@click="generateImage" :class="{ active: promptIsLoadingPrompt }" :disabled="!AIImagesIsUnderLimit")
          img.icon.openai(src="@/assets/openai.svg")
          span Generate

      //- errors
      .row.error-row(v-if="error")
        span.badge.danger (シ_ _)シ Something went wrong, Please try again or contact support
      .row.error-row(v-if="lengthError")
        span.badge.danger Prompts cannot be longer than 400 characters

  //- loading
  template(v-if="loading")
    section.results
      .row.loading-row
        Loader(:visible="true")
        p.info This may take up to 30 seconds…
  //- results
  template(v-else-if="images")
    section.results
      ul.results-list.image-list
        template(v-for="image in images")
          li(@click.left="selectImage(image)" tabindex="0" v-on:keydown.enter="selectImage(image)" :class="{ active: isCardUrl(image)}")
            img(:src="image.url")
  //- instructions
  template(v-else)
    section.instructions(v-if="AIImagesIsUnderLimit")
      p DALL·E AI image generation works best with detailed prompts that include a{{' '}}
        span.badge.info subject
        span {{', '}}
        span.badge.success action
        span , and{{' '}}
        span.badge.danger style
      //- example
      section.example.subsection
        p
          span.badge.info Teddy bears
          span {{' '}}
          span.badge.success shopping for groceries
          span {{' '}}
          span.badge.danger in the style of ukiyo-e
        img(src="https://kinopio-updates.us-east-1.linodeobjects.com/dall-e-example.jpg")

  AIImagesProgress(:showAIImageHistoryButton="true")

</template>

<script>
import AIImagesProgress from '@/components/AIImagesProgress.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

export default {
  name: 'AIImageGeneration',
  components: {
    Loader,
    AIImagesProgress
  },
  props: {
    visible: Boolean,
    initialPrompt: String,
    cardUrl: String
  },
  data () {
    return {
      loading: false,
      error: false,
      lengthError: false,
      prompt: '',
      images: undefined,
      loadingPrompt: ''
    }
  },
  computed: {
    promptInput: {
      get () {
        return this.prompt
      },
      set (newValue) {
        this.updatePrompt(newValue)
      }
    },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    promptIsLoadingPrompt () {
      if (!this.prompt) { return }
      return this.prompt === this.loadingPrompt
    },
    AIImagesIsUnderLimit () { return this.$store.getters['currentUser/AIImagesIsUnderLimit'] }
  },
  methods: {
    isCardUrl (image) {
      return this.cardUrl === image.url
    },
    selectImage (image) {
      this.$emit('selectImage', image)
    },
    async generateImage () {
      if (!this.prompt) { return }
      if (!this.AIImagesIsUnderLimit) { return }
      if (this.loading && this.promptIsLoadingPrompt) { return }
      if (this.prompt > this.lengthError) {
        this.lengthError = true
        return
      }
      this.loading = true
      this.images = undefined
      this.error = false
      this.lengthError = false
      const body = {
        prompt: this.prompt,
        userId: this.$store.state.currentUser.id
      }
      try {
        this.images = await this.$store.dispatch('api/createAIImage', body)
        this.updateCurrentUserAIImages()
      } catch (error) {
        console.error('🚒 generateImage', error)
        this.error = true
      }
      this.loading = false
    },
    updateCurrentUserAIImages () {
      let AIImages = this.$store.state.currentUser.AIImages
      AIImages = this.images.concat(AIImages)
      this.$store.commit('currentUser/AIImages', AIImages)
    },
    resetPinchCounterZoomDecimal () {
      this.$store.commit('pinchCounterZoomDecimal', 1)
    },
    focusPromptInput () {
      if (utils.isMobile()) { return }
      const element = this.$refs.promptInput
      const length = this.search.length
      element.focus()
      element.setSelectionRange(length, length)
      this.$store.commit('triggerUpdatePositionInVisualViewport')
    },
    textareaSize () {
      const textarea = this.$refs.promptInput
      if (!textarea) { return }
      textarea.style.height = textarea.scrollHeight + 1 + 'px'
    },
    updatePrompt (prompt) {
      this.prompt = prompt
      this.error = false
      this.lengthError = false
      this.textareaSize()
    },
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs', 'AIImageGeneration')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    clear () {
      this.updatePrompt('')
      this.images = undefined
      const textarea = this.$refs.promptInput
      textarea.style.height = 'initial'
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.images = undefined
        this.updatePrompt(this.initialPrompt)
        this.$nextTick(() => {
          this.textareaSize()
        })
      }
    }
  }
}
</script>

<style lang="stylus">
.ai-image-generation
  .button-generate
    margin 4px
    margin-bottom 10px
  .instructions,
  .results
    padding-top 0
  .instructions,
  .results
    border-top 0
    .badge
      margin 0
  .openai
    width 16px
    vertical-align -3px
  .search-wrap
    align-items flex-start
    .openai
      margin-top 2px
      margin-right 2px
    .loader
      margin-right 6px
      width 14px

  .badge.search
    background-color var(--search-background)
  .example
    display flex
    margin-top 10px
    img
      max-width 50%
      border-radius var(--entity-radius)
  .loading-row
    align-items center
    p.info
      margin 0
      margin-left 6px
  .flower
    vertical-align -2px
  .error-row
    margin-bottom 10px !important
</style>
