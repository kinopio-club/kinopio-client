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

const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())

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
const textareaWrapStyles = (card) => {
  let styles = {
    backgroundColor: card.backgroundColor
  }
  if (card.backgroundColor) {
    const borderRadius = utils.cssVariable('entity-radius')
    styles.borderRadius = borderRadius
  }

  return styles
}
const textareaStyles = (card) => {
  if (!card.backgroundColor) { return }
  let styles = {
    backgroundColor: card.backgroundColor
  }
  if (utils.colorIsDark(card.backgroundColor)) {
    const color = utils.cssVariable('primary-on-dark-background')
    styles.color = color
  } else {
    const color = utils.cssVariable('primary-on-light-background')
    styles.color = color
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
const focus = (card) => {
  store.commit('triggerScrollCardIntoView', card.id)
  store.commit('shouldPreventNextFocusOnName', true)
  store.commit('cardDetailsIsVisibleForCardId', card.id)
}
const focusTextarea = async (event, card) => {
  let element = section.value.querySelector(`textarea[data-card-id="${card.id}"]`)
  focus(card)
  await nextTick()
  await nextTick()
  element.focus()
  const end = element.textLength
  setTimeout(() => {
    element.setSelectionRange(end, end)
  })
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
const imageUrl = (card) => {
  const urls = utils.urlsFromString(card.name)
  if (!urls) { return }
  let imageUrl
  if (card.urlPreviewIsVisible && card.urlPreviewImage) {
    imageUrl = card.urlPreviewImage
  }
  urls.forEach(url => {
    if (utils.urlIsImage(url)) {
      imageUrl = url
    }
  })
  return imageUrl
}
</script>

<template lang="pug">
template(v-if="visible")
  section.text
    //- .row.title-row
      //- div
      //-   span {{cards.length}} Cards
      //-   span.badge.info(v-if="!canEditSpace") Read Only
      //-   //- span.badge.success(v-if="canEditSpace") Editable
      //- //- button(@click="addCard")
      //- //-   img.icon.add(src="@/assets/add.svg")
      //- button.small-button(title="By last edited")
      //-   img.icon.filter(src="@/assets/filter.svg")
      //-   //- span EditedAt
      //-   //- img.icon.down-arrow(src="@/assets/down-arrow.svg")
      //-   span ▼

    .row
      //- div Edit Cards as Text
      div Card Text Editor
      //- button.small-button
      //-   img.icon.filter(src="@/assets/filter.svg")
      //-   span Last Edited

    .row.title-row
      button(@click="copyText")
        img.icon.copy(src="@/assets/copy.svg")
        span Copy All
      //- button.small-button
      //-   img.icon.filter(src="@/assets/filter.svg")
        //- span Last Edited

  section.text.results-section(ref="section")
    template(v-for="(card, index) in cards")
      .textarea-wrap(:style="textareaWrapStyles(card)" @click="focusTextarea($event, card)")
        textarea(
          @click.stop
          :data-card-id="card.id"
          @focus="focus(card)"
          @keydown.up="moveToPrevious($event, index)"
          @keydown.down="moveToNext($event, index)"
          rows="1"
          :disabled="!canEditCard(card)"
          :value="card.name"
          @input="updateName($event, card)"
          :style="textareaStyles(card)"
        )
        img(v-if="imageUrl(card)" :src="imageUrl(card)" @click="focusTextarea($event, card)")
</template>

<style lang="stylus">

section.text
  // background-color var(--secondary-background)
  .textarea-wrap
    cursor pointer
    background-color var(--secondary-background)
    border-radius var(--entity-radius)
    padding 8px
    // padding-top 4px

    margin-bottom 4px

    // border-bottom 1px solid var(--primary-border)

    &:hover
      // box-shadow var(--hover-shadow)
      box-shadow var(--button-hover-shadow)
      // background-color var(--primary-background)
    &:active
      // box-shadow var(--active-shadow)
      box-shadow var(--button-active-inset-shadow)
    textarea
      // margin-bottom 2px
      margin-bottom 0
      // border-bottom 0

    img
      max-width 100px
      border-radius var(--entity-radius)
      margin-top 4px
      // margin-bottom -6px
      cursor pointer
  // span + .badge
  //   margin-left 3px
    // border-bottom 1px solid var(--primary-border)
</style>
