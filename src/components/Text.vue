<script setup>
import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

onMounted(() => {
  updateAllTextareaSizes()
})

const props = defineProps({
  visible: Boolean
})
const section = ref(null)

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateAllTextareaSizes()
  }
})

// list

const cards = computed(() => store.state.currentSpace.cards)
const canEditCard = (card) => {
  return store.getters['currentUser/canEditCard'](card)
}
const updateTextareaSize = (element) => {
  const modifier = 1
  element.style.height = element.scrollHeight + modifier + 'px'
}
const updateAllTextareaSizes = async () => {
  await nextTick()
  const textareas = section.value.querySelectorAll('textarea')
  textareas.forEach(element => {
    updateTextareaSize(element)
  })
}
const cardStyles = (card) => {
  let styles = {
    backgroundColor: card.backgroundColor
  }
  if (utils.colorIsDark(card.backgroundColor)) {
    const color = utils.cssVariable('primary-on-dark-background')
    styles.color = color
  }
  if (card.backgroundColor) {
    const borderRadius = utils.cssVariable('entity-radius')
    styles.borderRadius = borderRadius
  }
  return styles
}

// actions

const copyText = async (event) => {
  store.commit('clearNotificationsWithPosition')
  const position = utils.cursorPositionInPage(event)
  try {
    const text = utils.textFromCardNames(cards.value)
    await navigator.clipboard.writeText(text)
    store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}
// const addCard = (card) => {
//   card = card || cards.value[0]
//   console.log('same as Enter key in carddetails', card)
// }
const focus = async (event, card) => {
  store.commit('triggerScrollCardIntoView', card.id)
  store.commit('shouldPreventNextFocusOnName', true)
  store.commit('cardDetailsIsVisibleForCardId', card.id)
}

// keyboard navigation

const moveToPrevious = (event, index) => {
  if (index === 0) { return }
  const isCursorAtStart = event.target.selectionEnd === 0
  if (!isCursorAtStart) { return }
  const prev = event.target.parentElement.previousElementSibling.querySelector('textarea')
  const end = prev.textLength
  prev.focus()
  setTimeout(() => {
    prev.setSelectionRange(end, end)
  })
}
const moveToNext = (event, index) => {
  if (index === cards.value.length - 1) { return }
  const isCursorAtEnd = event.target.selectionEnd === event.target.textLength
  if (!isCursorAtEnd) { return }
  const next = event.target.parentElement.nextElementSibling.querySelector('textarea')
  next.focus()
  setTimeout(() => {
    next.setSelectionRange(0, 0)
  })
}

// editing

const updateName = (event, card) => {
  const newName = event.target.value
  store.commit('triggerUpdateCardDetailsCardName', { cardId: card.id, name: newName })
  const element = event.target
  updateTextareaSize(element)
}
</script>

<template lang="pug">
section.text(v-if="visible")
  .row
    p {{cards.length}} Cards
  .row
    button(@click="copyText")
      img.icon.copy(src="@/assets/copy.svg")
      span Copy
    //- button(@click="addCard")
    //-   img.icon.add(src="@/assets/add.svg")
section.results-section(ref="section")
  .textarea-wrap(v-for="(card, index) in cards")
    textarea(
      :data-card-id="card.id"
      @focus="focus($event, card)"
      @keydown.up="moveToPrevious($event, index)"
      @keydown.down="moveToNext($event, index)"
      rows="1"
      :disabled="!canEditCard(card)"
      :value="card.name"
      @input="updateName($event, card)"
      :style="cardStyles(card)"
      )
</template>

<style lang="stylus" scoped>
section
  overflow scroll
  background-color var(--primary-background)
  .textarea-wrap
    position relative
  textarea
    border-radius var(--entity-radius)
    border-bottom-left-radius 0
    border-bottom-right-radius 0
    padding 3px 6px
    &:focus
      border-radius var(--entity-radius)
</style>
