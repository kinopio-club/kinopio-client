<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'

import utils from '@/utils.js'
import consts from '@/consts.js'

const textareaWrapElement = ref(null)

onMounted(async () => {
  if (props.shouldAutoFocus) {
    focusName()
  }
  if (props.defaultValue) {
    state.newName = props.defaultValue
    await nextTick()
    updateTextareaSize()
  }
})

const emit = defineEmits(['updateName'])

const props = defineProps({
  maxLength: Number,
  placeholder: String,
  shouldAutoFocus: Boolean,
  defaultValue: String,
  htmlStringWithMatches: String
})
const state = reactive({
  newName: ''
})

const updateTextareaSize = async () => {
  await nextTick()
  const element = textareaWrapElement.value
  const textareas = element.querySelectorAll('textarea')
  const modifier = 1
  textareas.forEach(textarea => {
    const highlight = element.querySelector('.textarea-highlight')
    highlight.style.height = textarea.scrollHeight + modifier + 'px'
    textarea.style.height = textarea.scrollHeight + modifier + 'px'
  })
  element.style.height = textareas[0].scrollHeight + modifier + 'px'
}

// name

const name = computed({
  get () {
    return state.newName
  },
  set (value) {
    updateName(value)
  }
})
const updateName = (value) => {
  state.newName = value
  updateTextareaSize()
  emit('updateName', value)
}
const safeHtmlStringWithMatches = computed(() => {
  const string = props.htmlStringWithMatches
  if (!string) { return }
  return string.replaceAll('script', '')
})

// max length

const maxLength = computed(() => props.maxLength || consts.cardCharacterLimit)
const isMaxLength = computed(() => state.newName?.length >= (maxLength.value - 1))

// focus
const focusName = () => {
  if (utils.isMobile()) { return }
  const element = textareaWrapElement.value
  if (!element) { return }
  const textarea = element.querySelector('.textarea-input')
  textarea.focus()
}

</script>

<template lang="pug">
.textarea-wrap.textarea-wrap-component(ref="textareaWrapElement")
  p.textarea-highlight(
    v-html="safeHtmlStringWithMatches"
  )
  textarea.textarea-sizer(
    v-model="name"
    :maxLength="maxLength"
    @paste="updateName"
  )
  textarea.textarea-input(
    :placeholder="placeholder"
    v-model="name"
    :maxLength="maxLength"
  )
  span.badge.danger(v-if="isMaxLength")
    img.icon.cancel(src="@/assets/add.svg")
    span Max Length
</template>

<style lang="stylus">
.textarea-wrap-component
  position relative
  textarea
    margin-bottom 0
  .textarea-sizer
    pointer-events none
    opacity 0
  .textarea-input
    position absolute
    top 0
    left 0
  p.textarea-highlight
    pointer-events none
    position absolute
    top 1px
    left 1px
    color transparent
    .match
      background-color var(--info-background)
</style>
