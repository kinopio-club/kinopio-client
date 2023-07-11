<script setup>
import utils from '@/utils.js'
import consts from '@/consts.js'
import CardTips from '@/components/dialogs/CardTips.vue'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import sortBy from 'lodash-es/sortBy'
import dayjs from 'dayjs'
const store = useStore()

onMounted(() => {
  updateSortedCards()
  updateAllTextareaSizes()
})

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  cardTipsIsVisible: false,
  sortOrderIsDesc: true,
  sortedCards: []
})
const section = ref(null)

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateSortedCards()
    updateAllTextareaSizes()
  } else {
    closeDialogs()
  }
})

const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())

// dialogs

const closeDialogs = () => {
  state.cardTipsIsVisible = false
}
const toggleCardTipsIsVisible = () => {
  const value = !state.cardTipsIsVisible
  closeDialogs()
  state.cardTipsIsVisible = value
}

// cards

const cards = computed(() => store.getters['currentCards/all'])
const updateSortedCards = () => {
  const sorted = sortBy(cards.value, card => dayjs(card.nameUpdatedAt || card.updatedAt).valueOf())
  if (state.sortOrderIsDesc) {
    sorted.reverse()
  }
  state.sortedCards = sorted
}
const canEditCard = (card) => { return store.getters['currentUser/canEditCard'](card) }
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
const toggleSortOrder = () => {
  state.sortOrderIsDesc = !state.sortOrderIsDesc
  updateSortedCards()
}

// textarea

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
    const text = utils.textFromCardNames(state.sortedCards)
    await navigator.clipboard.writeText(text)
    store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}
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
const isMaxLength = (card) => {
  const isActive = store.state.cardDetailsIsVisibleForCardId === card.id
  const isMax = card.name.length >= consts.maxCardLength
  return isActive && isMax
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
  if (index === state.sortedCards.length - 1) { return }
  const isCursorAtEnd = event.target.selectionEnd === event.target.textLength
  if (!isCursorAtEnd) { return }
  const next = event.target.parentElement.nextElementSibling.querySelector('textarea')
  next.focus()
  setTimeout(() => {
    next.setSelectionRange(0, 0)
  })
}

</script>

<template lang="pug">
template(v-if="visible")
  section.text(@click="closeDialogs")
    .row.title-row
      div Card Text Editor
      //- sort
      .button-wrap(@click.stop="toggleSortOrder" title="Sort Order")
        button.small-button
          img.icon.time(src="@/assets/time.svg")
          template(v-if="state.sortOrderIsDesc")
            img.icon.triangle.down(src="@/assets/triangle.svg")
            //- span Latest
          template(v-else)
            img.icon.triangle(src="@/assets/triangle.svg")
            //- span Oldest
    .row.title-row
      //- copy
      button.small-button(@click="copyText")
        img.icon.copy(src="@/assets/copy.svg")
        span Copy
      //- tips
      .button-wrap(@click.stop="toggleCardTipsIsVisible")
        button.small-button(:class="{ active: state.cardTipsIsVisible }")
          span ?
        CardTips(:visible="state.cardTipsIsVisible" :preventScrollIntoView="true")

  section.text.results-section(ref="section" @click="closeDialogs")
    template(v-for="(card, index) in state.sortedCards")
      //- cards
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
          :maxlength="consts.maxCardLength"
          @input="updateName($event, card)"
          :style="textareaStyles(card)"
        )
        img(v-if="imageUrl(card)" :src="imageUrl(card)" @click="focusTextarea($event, card)")
        //- .badge.danger.max-length-badge(v-if="isMaxLength(card)") Max Length
</template>

<style lang="stylus">
section.text
  .textarea-wrap
    cursor text
    background-color var(--secondary-background)
    border-radius var(--entity-radius)
    padding 8px
    margin-bottom 4px
    position relative
    &:hover
      box-shadow var(--button-hover-shadow)
    &:active
      box-shadow var(--button-active-inset-shadow)
    textarea
      margin-bottom 0
    img
      max-width 100px
      border-radius var(--entity-radius)
      margin-top 4px
      margin-bottom -4px
      cursor text
    .max-length-badge
      position absolute
      bottom 4px
      right 4px

  .button-wrap
    padding-left 6px
    margin 0
  .triangle
    &.down
      transform scaleY(-1)
</style>
