<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import consts from '@/consts.js'
const store = useStore()

const textareaWrapElement = ref(null)

onMounted(() => {
  state.newName = props.defaultValue
  updateTextareaSize()
  if (props.shouldAutoFocus) {
    focusName()
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

const updateTextareaSize = () => {
  const element = textareaWrapElement.value
  let textareas = element.querySelectorAll('textarea')
  let modifier = 1
  textareas.forEach(textarea => {
    const highlight = element.querySelector('.textarea-highlight')
    highlight.style.height = textarea.scrollHeight + modifier + 'px'
    textarea.style.height = textarea.scrollHeight + modifier + 'px'
  })
}

// name

const name = computed({
  get () {
    return state.newName
  },
  set (value) {
    state.newName = value
    updateTextareaSize()
    emit('updateName', value)
  }
})

// max length

const maxLength = computed(() => props.maxLength || consts.maxCardLength)
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
.textarea-wrap(ref="textareaWrapElement")
  p.textarea-highlight(
    v-html="htmlStringWithMatches"
  )
  textarea.textarea-sizer(
    v-model="name"
    :maxLength="maxLength"
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
.textarea-wrap
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
      background-color var(--search-background)
</style>
