<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import UserLabelInline from '@/components/UserLabelInline.vue'
import NameSegment from '@/components/NameSegment.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'

const store = useStore()

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'triggerRemoveCardFromCardList') {
      const card = mutation.payload
      state.removedCardIds.push(card.id)
    }
  })
})

const emit = defineEmits(['selectCard', 'removeCard'])

const props = defineProps({
  cards: Array,
  search: String,
  cardsShowRemoveButton: Boolean,
  dateIsCreatedAt: Boolean
})

const state = reactive({
  removedCardIds: []
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
</script>

<template lang="pug">
span
  ul.results-list.card-list(ref="resultsList")
    template(v-for="card in normalizedCards" :key="card.id")
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
