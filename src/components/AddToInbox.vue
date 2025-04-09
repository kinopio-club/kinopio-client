<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import consts from '@/consts.js'

const store = useStore()

const textareaElement = ref(null)

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  newName: ''
})

const textareaPlaceholder = computed(() => 'Type here, or paste a URL')
const maxCardCharacterLimit = computed(() => consts.defaultCharacterLimit)
const name = computed({
  get () {
    return state.newName
  },
  set (newName) {
    state.newName = newName
    updateTextareaSize()
    // clearErrorsAndSuccess()
    // updateMaxLengthError()
  }
})
const updateTextareaSize = () => {
  if (!textareaElement.value) { return }
  let modifier = 0
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

</script>

<template lang="pug">
section.add-to-inbox(v-if="props.visible")
  .row.title-row
    div
      span Add to Inbox
    .button-wrap
      button.small-button(@click="loadInboxSpace")
        img.icon(src="@/assets/inbox.svg")
        span Inbox
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
  button
    img.icon.add-icon(src="@/assets/add.svg")
    span Add
</template>

<style lang="stylus">
// .component-name
</style>
