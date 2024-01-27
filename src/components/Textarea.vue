<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import consts from '@/consts.js'
const store = useStore()

const textareaElement = ref(null)

onMounted(() => {
  state.newName = props.defaultValue
  updateTextareaSize()
})

// const emit = defineEmits(['updateCount'])

const props = defineProps({
  maxLength: Number,
  textareaPlaceholder: Boolean,
  shouldAutoFocus: Boolean,
  defaultValue: String
})
const state = reactive({
  newName: '',
  error: {
    maxLength: true
  }
})

const updateTextareaSize = () => {
  if (!textareaElement.value) { return }
  let modifier = 0
  textareaElement.value.style.height = textareaElement.value.scrollHeight + modifier + 'px'
}
const clearErrorsAndSuccess = () => {
  console.log('clearErrorsAndSuccess')
}

// name

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

// max length

const maxLength = computed(() => props.maxLength || consts.maxCardLength)
const updateMaxLengthError = () => {
  if (state.newName.length >= maxLength.value - 1) {
    state.error.maxLength = true
  } else {
    state.error.maxLength = false
  }
}

// event handlers

const handleEnter = (event) => {
  console.log(event)
}
const handleFocus = (value) => {
  console.log(value)
}

// focus

const focusName = () => {
  const element = textareaElement.value
  if (!element) { return }
  element.focus()
}
const focusAndSelectName = () => {
  if (utils.isMobile()) { return }
  const element = textareaElement.value
  if (!element) { return }
  const length = element.value.length
  focusName()
  if (length) {
    element.setSelectionRange(0, length)
  }
}

</script>

<template lang="pug">
.textarea-wrap
  textarea.name(
    name="textarea"
    ref="textareaElement"
    rows="1"
    :placeholder="textareaPlaceholder"
    v-model="name"
    :maxlength="maxLength"
    @keydown.enter.exact.prevent="handleEnter"
    @focusin="handleFocus(true)"
    @focusout="handleFocus(false)"
    @keyup.alt.enter.exact.stop
    @keyup.ctrl.enter.exact.stop
    @keydown.alt.enter.exact.stop="insertLineBreak"
    @keydown.ctrl.enter.exact.stop="insertLineBreak"
    @touchend="focusName"
  )
span.badge.danger(v-if="state.error.maxLength")
  img.icon.cancel(src="@/assets/add.svg")
  span Max Length
</template>

<style lang="stylus">
// .component-name
</style>
