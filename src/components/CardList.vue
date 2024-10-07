<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import UserLabelInline from '@/components/UserLabelInline.vue'
import NameSegment from '@/components/NameSegment.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'

const store = useStore()

const itemsPerPage = 60

const resultsListElement = ref(null)

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'triggerRemoveCardFromCardList') {
      const card = mutation.payload
      state.removedCardIds.push(card.id)
    }
  })
  updateScroll()
  resultsListElement.value.closest('section').addEventListener('scroll', updateScroll)
  if (props.disableListOptimizations) {
    state.currentPage = totalPages.value
  }
})

const emit = defineEmits(['selectCard', 'removeCard'])

const props = defineProps({
  cards: Array,
  search: String,
  cardsShowRemoveButton: Boolean,
  dateIsCreatedAt: Boolean,
  resultsSectionHeight: Number
})

const state = reactive({
  removedCardIds: [],
  scrollY: 0,
  currentPage: 1,
  prevScrollAreaHeight: 0
})

const normalizedCards = computed(() => {
  let items = utils.clone(props.cards)
  items = items.filter(card => !state.removedCardIds.includes(card.id))
  return items.map(card => {
    card = store.getters['currentCards/nameSegments'](card)
    card.user = store.getters['currentSpace/userById'](card.userId)
    if (!card.user) {
      card.user = {
        id: '',
        name: '',
        color: undefined
      }
    }
    return card
  })
})

const urlPreviewImage = (card) => {
  if (!card.urlPreviewIsVisible) { return }
  return card.urlPreviewImage
}
const selectCard = (card) => {
  emit('selectCard', card)
}
const removeCard = (card) => {
  emit('removeCard', card)
}
const cardIsActive = (card) => {
  const isCardDetailsVisible = store.state.cardDetailsIsVisibleForCardId === card.id
  return isCardDetailsVisible || card.isLoading
}
const cardIsFocused = (card) => {
  return store.state.previousResultItem.id === card.id
}
const relativeDate = (card) => {
  if (props.dateIsCreatedAt) {
    return utils.shortRelativeTime(card.createdAt)
  }
  return utils.shortRelativeTime(card.nameUpdatedAt || card.updatedAt)
}
const userIsNotCurrentUser = (userId) => {
  return store.state.currentUser.id !== userId
}
const isStrikeThrough = (card) => {
  return card.name.startsWith('[x]')
}
const isThemeDark = computed(() => store.getters['themes/isThemeDark'])
const colorIsDark = (card) => {
  if (!card.backgroundColor) {
    return isThemeDark.value
  }
  return utils.colorIsDark(card.backgroundColor)
}
const styles = (card) => {
  return {
    backgroundColor: card.backgroundColor
  }
}

// scroll

watch(() => props.resultsSectionHeight, async (value, prevValue) => {
  await nextTick()
  updateScroll()
})
watch(() => props.isLoading, async (value, prevValue) => {
  await nextTick()
  updateScroll()
})
const updateScroll = async () => {
  await nextTick()
  let element = resultsListElement.value
  if (!element) { return }
  element = element.closest('section')
  if (!element) {
    console.error('scroll element not found', element)
  }
  state.scrollY = element.scrollTop
  const scrollHeight = element.getBoundingClientRect().height
  let minItemHeight = 36 // 37.5
  state.pageHeight = itemsPerPage * minItemHeight * state.currentPage
  updateCurrentPage()
}

// list render optimization

const updateCurrentPage = () => {
  const zoom = utils.pinchCounterZoomDecimal()
  const threshold = 600
  const nearBottomY = state.pageHeight - (threshold * state.currentPage)
  if ((state.scrollY * zoom) > nearBottomY) {
    state.currentPage = Math.min(state.currentPage + 1, totalPages.value)
  }
}
const totalPages = computed(() => {
  const items = normalizedCards.value
  const total = Math.ceil(items.length / itemsPerPage)
  return total
})
const itemsRendered = computed(() => {
  let items = normalizedCards.value
  const max = state.currentPage * itemsPerPage
  items = items.slice(0, max)
  return items
})

</script>

<template lang="pug">
span
  ul.results-list.card-list(ref="resultsListElement")
    .prev-scroll-area-height(:style="{height: state.prevScrollAreaHeight + 'px'}")
    template(v-for="card in itemsRendered" :key="card.id")
      li(@click.stop="selectCard(card)" :data-card-id="card.id" :class="{active: cardIsActive(card), hover: cardIsFocused(card)}")
        //- date
        span.badge.status.inline-badge
          img.icon.time(src="@/assets/time.svg")
          span {{ relativeDate(card) }}
        //- user
        UserLabelInline(v-if="userIsNotCurrentUser(card.user.id)" :user="card.user")
        //- name
        span.card-info(:class="{ badge: card.backgroundColor, 'is-dark': colorIsDark(card) }" :style="styles(card)")
          template(v-for="segment in card.nameSegments")
            img.card-image(v-if="segment.isImage" :src="segment.url")
            img.card-image(v-if="urlPreviewImage(card)" :src="urlPreviewImage(card)")
            NameSegment(:segment="segment" :search="props.search" :isStrikeThrough="isStrikeThrough(card)" :backgroundColorIsDark="colorIsDark(card)")
          //- remove
          button.small-button.remove-button.danger(v-if="props.cardsShowRemoveButton" @click.left.stop="removeCard(card)")
            img.icon(src="@/assets/remove.svg")
          //- loading
          Loader(:visible="card.isLoading")
</template>

<style lang="stylus">
.card-list
  li
    position relative
    display block !important
    .button-badge
      box-shadow none
      display initial
      margin-right 0
      pointer-events none
      &:hover,
      &:active
        box-shadow none
    img
      max-width 48px
      border-radius var(--small-entity-radius)
      vertical-align middle
  .time
    vertical-align 0
    height 11px
  .inline-badge
    display inline-block
  .remove-button
    position absolute
    top 7px
    right 4px
    .icon
      vertical-align 0
  .loader
    position absolute
    top 6px
    left 8px
  .card-info
    &.badge
      position initial
      &.is-dark
        color var(--primary-on-dark-background)
</style>
