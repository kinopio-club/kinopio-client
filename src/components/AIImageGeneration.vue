<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import AIImagesProgress from '@/components/AIImagesProgress.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
const store = useStore()

const textareaElement = ref(null)

onMounted(() => {
  console.log(`🐴 the component is now mounted.`, store.state.currentSpace)
  // store.subscribe((mutation, state) => {
  //   if (mutation.type === 'triggerUpdateOtherCard') {
  //     mutation.payload
  //   }
  // })
})

const props = defineProps({
  visible: Boolean,
  initialPrompt: String,
  cardUrl: String
})
const emit = defineEmits(['selectImage'])

watch(() => props.visible, async (value, prevValue) => {
  if (value) {
    state.images = undefined
    updatePrompt(state.initialPrompt)
    await nextTick()
    textareaSize()
  }
})

const state = reactive({
  loading: false,
  error: false,
  lengthError: false,
  prompt: '',
  images: undefined,
  loadingPrompt: ''
})

const promptInput = computed({
  get () {
    return state.prompt
  },
  set (newValue) {
    updatePrompt(newValue)
  }
})
const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const promptIsLoadingPrompt = computed(() => {
  if (!state.prompt) { return }
  return state.prompt === state.loadingPrompt
})
const AIImagesIsUnderLimit = computed(() => store.getters['currentUser/AIImagesIsUnderLimit'])

const isCardUrl = (image) => {
  return props.cardUrl === image.url
}
const selectImage = (image) => {
  emit('selectImage', image)
}
const generateImage = async () => {
  if (!state.prompt) { return }
  if (!AIImagesIsUnderLimit.value) { return }
  if (state.loading && promptIsLoadingPrompt.value) { return }
  if (state.prompt > state.lengthError) {
    state.lengthError = true
    return
  }
  state.loading = true
  state.images = undefined
  state.error = false
  state.lengthError = false
  const body = {
    prompt: state.prompt,
    userId: store.state.currentUser.id
  }
  try {
    state.images = await store.dispatch('api/createAIImage', body)
    updateCurrentUserAIImages()
  } catch (error) {
    console.error('🚒 generateImage', error)
    state.error = true
  }
  state.loading = false
}
const updateCurrentUserAIImages = () => {
  let AIImages = store.state.currentUser.AIImages
  AIImages = state.images.concat(AIImages)
  store.commit('currentUser/AIImages', AIImages)
}
const resetPinchCounterZoomDecimal = () => {
  store.commit('pinchCounterZoomDecimal', 1)
}
const focusPromptInput = () => {
  if (utils.isMobile()) { return }
  const element = textareaElement.value
  const length = element.value.length
  element.focus()
  element.setSelectionRange(length, length)
  store.commit('triggerUpdatePositionInVisualViewport')
}
const textareaSize = () => {
  const textarea = textareaElement.value
  if (!textarea) { return }
  textarea.style.height = textarea.scrollHeight + 1 + 'px'
}
const updatePrompt = (prompt) => {
  state.prompt = prompt
  state.error = false
  state.lengthError = false
  textareaSize()
}
const triggerSignUpOrInIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerSignUpOrInIsVisible')
}
const clear = () => {
  updatePrompt('')
  state.images = undefined
  const textarea = textareaElement.value
  textarea.style.height = 'initial'
}
</script>

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
        img.icon.openai(v-if="!state.loading" src="@/assets/openai.svg" @click.left="focusPromptInput")
        Loader(:visible="state.loading")
        textarea(
          placeholder="Puppies in a victorian style"
          v-model="promptInput"
          ref="textareaElement"
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
      .row.error-row(v-if="state.error")
        span.badge.danger (シ_ _)シ Something went wrong, Please try again or contact support
      .row.error-row(v-if="state.lengthError")
        span.badge.danger Prompts cannot be longer than 400 characters

  //- loading
  template(v-if="state.loading")
    section.results
      .row.loading-row
        Loader(:visible="true")
        p.info This may take up to 30 seconds…
  //- results
  template(v-else-if="state.images")
    section.results
      ul.results-list.image-list
        template(v-for="image in state.images")
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
        img(src="https://updates.kinopio.club/dall-e-example.jpg")

  AIImagesProgress(:showAIImageHistoryButton="true")
</template>

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
