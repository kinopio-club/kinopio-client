<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import AIImagesProgress from '@/components/AIImagesProgress.vue'
import utils from '@/utils.js'
const store = useStore()

const sectionElement = ref(null)

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'updatePageSizes') {
      updateHeight()
    }
  })
})

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    clear()
    updateHeight()
  }
})

const state = reactive({
  height: null,
  selectedAIImage: {}
})

const clear = () => {
  state.selectedAIImage = {}
}
const updateHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  state.height = utils.elementHeight(sectionElement.value, true)
}
const AIImages = computed(() => {
  let AIImages = store.state.currentUser.AIImages
  AIImages = utils.clone(AIImages)
  return AIImages.reverse()
})
const copy = async (event, text) => {
  let position = utils.cursorPositionInPage(event)
  position.x = position.x - 60
  try {
    await navigator.clipboard.writeText(text)
    store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
  event.target.blur()
}
const isSelectedImage = (image) => {
  return state.selectedAIImage.url === image.url
}
const toggleSelectedImage = (image) => {
  if (image.url === state.selectedAIImage.url) {
    clear()
  } else {
    state.selectedAIImage = image
  }
}

</script>

<template lang="pug">
.ai-images(v-if="visible" @click.stop="clear")
  section(v-if="!AIImages.length")
    p AI Images you generate from cards can be found here.
    p
      .badge.secondary Card →{{' '}}
        img.icon.flower(src="@/assets/flower.svg")
        span → AI
  AIImagesProgress
  section.results-section(v-if="AIImages.length" ref="sectionElement" :style="{'max-height': state.height + 'px'}")
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
              .input-button-wrap.copy-prompt(@click.stop="copy($event, image.prompt)")
                button.small-button
                  img.icon.copy(src="@/assets/copy.svg")
          //- copy url
          .input-button-wrap.copy-image-url(@click.stop="copy($event, image.url)")
            button.small-button
              img.icon.copy(src="@/assets/copy.svg")
</template>

<style lang="stylus">
.ai-images
  overflow auto
  border-top 1px solid var(--primary-border)
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
  .flower
    vertical-align -2px
</style>
