<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'
import Loader from '@/components/Loader.vue'

import { nanoid } from 'nanoid'

const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()

const textareaElement = ref(null)

const emit = defineEmits(['addCard'])

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  newName: '',
  error: {
    unknownServerError: false,
    maxLength: false
  },
  success: false
})

const textareaPlaceholder = computed(() => 'Type here, or paste a URL')
const maxCardCharacterLimit = computed(() => consts.cardCharacterLimit)
const updateMaxLengthError = () => {
  if (state.newName.length >= consts.cardCharacterLimit - 1) {
    state.error.maxLength = true
  } else {
    state.error.maxLength = false
  }
}
const clearErrorsAndSuccess = () => {
  state.error.unknownServerError = false
  state.success = false
}
const name = computed({
  get () {
    return state.newName
  },
  set (newName) {
    state.newName = newName
    updateTextareaSize()
    clearErrorsAndSuccess()
    updateMaxLengthError()
  }
})
const updateTextareaSize = () => {
  if (!textareaElement.value) { return }
  const modifier = 0
  textareaElement.value.style.height = textareaElement.value.scrollHeight + modifier + 'px'
}
const insertLineBreak = async (event) => {
  const position = textareaElement.value.selectionEnd
  const name = state.newName
  const newName = name.substring(0, position) + '\n' + name.substring(position)
  setTimeout(() => {
    textareaElement.value.setSelectionRange(position + 1, position + 1)
  })
  state.newName = newName
  await nextTick()
  updateTextareaSize()
}

const addCard = async () => {
  clearErrorsAndSuccess()
  if (!state.newName) { return }
  if (state.error.maxLength) { return }
  // show completion immediately, assume success
  const newName = state.newName
  state.success = true
  state.newName = ''
  textareaElement.value.style.height = 'initial'
  const element = textareaElement.value
  element.focus()
  const url = utils.urlFromString(newName)
  // create card
  const card = {
    id: nanoid(),
    name: newName,
    z: 1,
    nameUpdatedAt: new Date()
  }
  if (url) {
    card.urlPreviewUrl = url
    card.shouldUpdateUrlPreview = true
  }
  try {
    const user = userStore.getUserAllState
    card.userId = user.id
    console.info('🛫 create card in inbox space', card)
    await apiStore.addToQueue({ name: 'createCardInInbox', body: card })
  } catch (error) {
    console.error('🚒 addCard', error)
    state.error.unknownServerError = true
  }
  addCardToSpaceLocal(card)
  emit('addCard', card)
}
const addCardToSpaceLocal = async (card) => {
  const space = await cache.getInboxSpace()
  if (!space) { return }
  if (!space.cards) { return }
  const cards = space.cards.push(card)
  cache.updateSpace('cards', cards, space.id)
}
</script>

<template lang="pug">
section.add-to-inbox(v-if="props.visible")
  section.subsection
    .row
      p Add to Inbox
    .textarea-wrap
      textarea.name(
        name="cardName"
        ref="textareaElement"
        rows="1"
        :placeholder="textareaPlaceholder"
        v-model="name"
        :maxlength="maxCardCharacterLimit"
        @keydown.enter.exact.prevent="addCard"
        @keyup.alt.enter.exact.stop
        @keyup.ctrl.enter.exact.stop
        @keydown.alt.enter.exact.stop="insertLineBreak"
        @keydown.ctrl.enter.exact.stop="insertLineBreak"
      )
    .row
      button(@click="addCard")
        img.icon.add-icon(src="@/assets/add.svg")
        span Add
      .badge.error-badge.danger(v-if="state.error.maxLength")
        span Max Length {{maxCardCharacterLimit}}
      .badge.error-badge.danger(v-if="state.error.unknownServerError")
        span (シ_ _)シ Something went wrong, Please try again or contact support
</template>

<style lang="stylus">
section.add-to-inbox
  .error-badge
    margin-left 6px
    margin-right 0
</style>
