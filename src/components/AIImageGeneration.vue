<template lang="pug">
.ai-image-generation(v-if="visible")
  section.results-section.search-input-wrap
    section.subsection(v-if="shouldPrevent")
      p Because of the cost of generating AI images, you'll need to upgrade your account to use this
      .button-wrap
        button(v-if="!currentUserIsSignedIn" @click.left="triggerSignUpOrInIsVisible")
          span Sign Up or In
        button(v-if="!currentUserIsUpgraded" @click.left="triggerUpgradeUserIsVisible")
          span Upgrade

    //- input
    template(v-if="!shouldPrevent")
      .search-wrap
        img.icon.search(v-if="!loading" src="@/assets/search.svg" @click.left="focusPromptInput")
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
        )
        button.borderless.clear-input-wrap(@click.left="clear")
          img.icon.cancel(src="@/assets/add.svg")
      .button-wrap
        button.button-generate(@click="generateImage" :class="{ active: loading }")
          img.icon.openai(src="@/assets/openai.svg")
          span Generate
      //- error
      p(v-if="error")
        .row
          span.badge.danger (シ_ _)シ Something went wrong, Please try again or contact support

  //- results
  template(v-if="loading || images")
    section.results
      .row
        Loader(:visible="loading")
      ul.results-list.image-list
        template(v-for="image in images")
          li(@click.left="selectImage(image)" tabindex="0" v-on:keydown.enter="selectImage(image)" :class="{ active: isCardUrl(image)}")
            img(:src="image.url")

      //- ..results..
  //- instructions
  template(v-else)
    section.instructions
      p Dall-e AI image generation work best with detailed prompts that include a
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

  section
    p This feature is in beta, a montly limit may be introduced in the future if needed
</template>

<script>
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

export default {
  name: 'AIImageGeneration',
  components: {
    Loader
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
      prompt: '',
      images: undefined
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
    currentUserIsUpgraded () { return this.$store.state.currentUser.isUpgraded },
    shouldPrevent () { return !this.currentUserIsSignedIn || !this.currentUserIsUpgraded }
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
      if (this.loading) { return }
      this.loading = true
      this.images = undefined
      this.error = false
      const body = {
        prompt: this.prompt,
        userId: this.$store.state.currentUser.id
      }
      try {
        this.images = await this.$store.dispatch('api/createAIImage', body)
      } catch (error) {
        console.error('🚒 generateImage', error)
        this.error = true
        // handle err: rate limit, user limit err
      }
      this.loading = false
      // Then, user confirms the image by clicking on it -> emit selectImage(image)
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
      this.textareaSize()
    },
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs', 'AIImageGeneration.triggerSignUpOrInIsVisible')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    triggerUpgradeUserIsVisible () {
      this.$store.dispatch('closeAllDialogs', 'AIImageGeneration.triggerUpgradeUserIsVisible')
      this.$store.commit('triggerUpgradeUserIsVisible')
    },
    clear () {
      this.updatePrompt('')
      // and clear returned image
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
  .instructions,
  .results
    border-top 0
    .badge
      margin 0
  .openai
    width 16px
    vertical-align -3px
  .badge.search
    background-color var(--search-background)
  .example
    display flex
    margin-top 10px
    img
      max-width 50%
      border-radius var(--entity-radius)
</style>
