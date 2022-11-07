<template lang="pug">
.ai-image-generation(v-if="visible")
  template(v-if="!currentUserIsSignedIn || !currentUserIsUpgraded")
    section
      p Because of the cost of generating AI images, you'll need to upgrade your account
      .button-wrap
        button(v-if="!currentUserIsSignedIn" @click.left="triggerSignUpOrInIsVisible")
          span Sign Up or In
        button(v-if="!currentUserIsUpgraded" @click.left="triggerUpgradeUserIsVisible")
          span Upgrade

  template(v-else)
    section.results-section.search-input-wrap
      .search-wrap
        img.icon.search(v-if="!loading" src="@/assets/search.svg" @click.left="focusPromptInput")
        Loader(:visible="loading")
        textarea(
          placeholder="Puppies in a victorian style"
          v-model="promptInput"
          ref="promptInput"
          @focus="resetPinchCounterZoomDecimal"
          @update="textareaSize"
          @keyup.stop.backspace
          @keyup.stop.enter
          @mouseup.stop
          @touchend.stop
          rows="1"
        )
        button.borderless.clear-input-wrap(@click.left="clear")
          img.icon.cancel(src="@/assets/add.svg")

      .button-wrap
        button
          img.icon.openai(src="@/assets/openai.svg")
          span Generate

    section.instructions
      p Dall-e AI image generation work best with detailed prompts that include a
      span.badge.info subject
      span {{', '}}
      span.badge.success action
      span , and{{' '}}
      span.badge.danger style

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
    initialPrompt: String
  },
  data () {
    return {
      loading: false,
      prompt: ''
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
    currentUserIsUpgraded () { return this.$store.state.currentUser.isUpgraded }
  },
  methods: {
    generateImage () {
      // if (this.prompt) {
      //   this.loading = true
      //   api call (via server),
      // }

      // user confirms the image by clicking on it -> emit selectImage(image)
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
        this.updatePrompt(this.initialPrompt)
      }
    }
  }
}
</script>

<style lang="stylus">
.ai-image-generation
  .results-section
    .button-wrap
      margin 4px
  .instructions
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
