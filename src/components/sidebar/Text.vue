<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import consts from '@/consts.js'
import CardTips from '@/components/dialogs/CardTips.vue'
import Loader from '@/components/Loader.vue'

import sortBy from 'lodash-es/sortBy'
import dayjs from 'dayjs'
import { nanoid } from 'nanoid'
const store = useStore()

onMounted(() => {
  updateSortedCards()
  updateAllTextareaSizes()
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerCloseChildDialogs') {
      closeDialogs()
    } else if (mutation.type === 'isLoadingSpace') {
      if (!props.visible) { return }
      updateSortedCards()
    }
  })
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
let prevIndex

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateSortedCards()
  } else {
    closeDialogs()
  }
})

const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())
const isLoadingSpace = computed(() => store.state.isLoadingSpace)

// dialogs

const closeDialogs = () => {
  state.cardTipsIsVisible = false
}
const toggleCardTipsIsVisible = () => {
  const value = !state.cardTipsIsVisible
  closeDialogs()
  state.cardTipsIsVisible = value
}

// sort

const updateSortedCards = () => {
  let sorted = sortBy(cards.value, card => dayjs(card.nameUpdatedAt || card.updatedAt).valueOf())
  if (state.sortOrderIsDesc) {
    sorted.reverse()
  }
  state.sortedCards = sorted
  updateAllTextareaSizes()
}
const updateSortedCardsWithNewCard = ({ newCardId, index }) => {
  let sorted = utils.clone(state.sortedCards)
  const newCard = cards.value.find(card => card.id === newCardId)
  sorted = utils.insertIntoArray(sorted, newCard, index)
  state.sortedCards = sorted
}
const removeFromSortedCards = (index) => {
  let sorted = utils.clone(state.sortedCards)
  sorted = utils.removeFromArray(sorted, index)
  state.sortedCards = sorted
}
const toggleSortOrder = () => {
  state.sortOrderIsDesc = !state.sortOrderIsDesc
  updateSortedCards()
}

// cards

const canEditCard = (card) => { return store.getters['currentUser/canEditCard'](card) }
const updateName = (event, card) => {
  const newName = event.target.value
  store.commit('triggerUpdateCardDetailsCardName', { cardId: card.id, name: newName })
  const element = event.target
  updateTextareaSize(element)
}
const cards = computed(() => store.getters['currentCards/all'])
const addCardAtIndex = (event) => {
  if (!canEditSpace.value) {
    const position = utils.cursorPositionInPage(event)
    store.commit('addNotificationWithPosition', { message: 'Space is Read Only', position, type: 'info', layer: 'app', icon: 'cancel' })
    return
  }
  let index = prevIndex || 0
  let card = state.sortedCards[index]
  if (!prevIndex) {
    index = -1
  } else {
    index += 1
  }
  card = card || state.sortedCards[index]
  addCard(card, index)
}
const addCard = async (card, index) => {
  if (card && !card.name) { return }
  if (!card) {
    card = null
  }
  const newCardId = nanoid()
  store.commit('shouldPreventNextFocusOnName', true)
  store.commit('shouldPreventNextEnterKey', false)
  store.commit('triggerAddCard', { id: newCardId })
  await nextTick()
  updateSortedCardsWithNewCard({ newCardId, index })
  await nextTick()
  const element = section.value.querySelector(`textarea[data-card-id="${newCardId}"]`)
  updateAllTextareaSizes()
  element.focus()
  prevIndex = index
}
const addChildCard = async (card, index) => {
  if (!card.name) { return }
  const newCardId = nanoid()
  store.commit('parentCardId', card.id)
  store.commit('shouldPreventNextFocusOnName', true)
  store.commit('shouldPreventNextEnterKey', false)
  store.commit('triggerAddChildCard', { id: newCardId })
  await nextTick()
  updateSortedCardsWithNewCard({ newCardId, index })
  await nextTick()
  const element = section.value.querySelector(`textarea[data-card-id="${newCardId}"]`)
  updateAllTextareaSizes()
  element.focus()
  prevIndex = index
}
const removeEmpty = (card, index) => {
  if (card.name) { return }
  store.dispatch('currentSpace/removeEmptyCards')
  removeFromSortedCards(index)
}

// textarea

const updateTextareaSize = (element) => {
  const modifier = 1
  element.style.height = element.scrollHeight + modifier + 'px'
}
const updateAllTextareaSizes = async () => {
  if (!props.visible) { return }
  await nextTick()
  const textareas = section.value.querySelectorAll('textarea')
  textareas.forEach(element => {
    element.style.height = null
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

// actions

const focus = (card, index) => {
  store.commit('triggerScrollCardIntoView', card.id)
  store.commit('shouldPreventNextFocusOnName', true)
  store.commit('cardDetailsIsVisibleForCardId', card.id)
  prevIndex = index
}
const focusTextarea = async (card, index) => {
  let element = section.value.querySelector(`textarea[data-card-id="${card.id}"]`)
  focus(card, index)
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
  const isMax = card.name.length >= consts.defaultCharacterLimit
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

// global search

const isInSearchResultsCards = (card) => {
  const results = store.state.searchResultsCards
  if (!results.length) { return }
  return Boolean(results.find(result => result.id === card.id))
}

</script>

<template lang="pug">
template(v-if="visible")
  section.text(@click="closeDialogs")
    .row.title-row
      div
        span Card Text Editor&nbsp;
        Loader(:visible="isLoadingSpace" :isSmall="true")

      //- tips
      .button-wrap(@click.stop="toggleCardTipsIsVisible")
        button.small-button(:class="{ active: state.cardTipsIsVisible }")
          span ?
      Teleport(to="header")
        CardTips(:visible="state.cardTipsIsVisible" :preventScrollIntoView="true" :shouldHideAdvanced="true")

    .row.title-row
      div
        button.small-button(@click="addCardAtIndex")
          img.icon.add(src="@/assets/add.svg")
          span Card
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

  section.text.results-section(ref="section" @click="closeDialogs")
    template(v-for="(card, index) in state.sortedCards")
      //- edit
      template(v-if="canEditCard(card)")
        .textarea-wrap(@click="focusTextarea(card, index)" :style="textareaWrapStyles(card)")
          textarea(
            @click.stop
            :data-card-id="card.id"
            @focus="focus(card, index)"
            @blur="removeEmpty(card, index)"
            @keydown.up="moveToPrevious($event, index)"
            @keydown.down="moveToNext($event, index)"
            @keydown.enter.exact.prevent="addCard(card, index + 1)"
            @keydown.shift.enter.exact.prevent="addChildCard(card, index + 1)"
            rows="1"
            :disabled="!canEditCard(card)"
            :value="card.name"
            :maxlength="consts.defaultCharacterLimit"
            @input="updateName($event, card)"
            :style="textareaStyles(card)"
          )
          img(v-if="imageUrl(card)" :src="imageUrl(card)" @click="focusTextarea(card, index)")
          .badge.danger.max-length-badge(v-if="isMaxLength(card)") Max Length
          //- search
          span.badge.search.badge-search(v-if="isInSearchResultsCards(card)")
            img.icon.search(src="@/assets/search.svg")

      //- read only
      template(v-else)
        .textarea-wrap(@click="focus(card, index)" :style="textareaWrapStyles(card)")
          p.read-only-name
            span {{card.name}}
          img(v-if="imageUrl(card)" :src="imageUrl(card)" @click="focus(card, index)")
          //- search
          span.badge.search.badge-search(v-if="isInSearchResultsCards(card)")
            img.icon.search(src="@/assets/search.svg")

</template>

<style lang="stylus">
section.text
  .textarea-wrap
    cursor text
    padding 2px 4px
    position relative
    textarea
      margin-bottom 0
    .read-only-name
      word-break break-word
    img
      max-width 60px
      max-height 60px
      border-radius var(--entity-radius)
      margin-top 4px
      margin-bottom -4px
      cursor text
    .max-length-badge
      position absolute
      top 8px
      right 4px

  .button-wrap
    padding-left 6px
    margin 0
  .triangle
    &.down
      transform scaleY(-1)

  .badge-search
    position absolute
    right 4px
    bottom 6px
    img
      margin 0
      cursor auto
  .loader
    vertical-align -2px
  // @media(max-height 500px)
  //   dialog.card-tips
  //     top -50px

</style>
