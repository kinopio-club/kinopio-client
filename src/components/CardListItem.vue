<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useGlobalStore } from '@/stores/useGlobalStore'

import UserLabelInline from '@/components/UserLabelInline.vue'
import ItemCheckboxButton from '@/components/ItemCheckboxButton.vue'
import NameSegment from '@/components/NameSegment.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'

import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import { colord, extend } from 'colord'
import namesPlugin from 'colord/plugins/names'

extend([namesPlugin])
dayjs.extend(isToday)

const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const themeStore = useThemeStore()
const globalStore = useGlobalStore()

const itemsPerPage = 15
const minItemHeight = 32 // 36 // 37.5
const resultsListElement = ref(null)

const emit = defineEmits(['selectCard', 'removeCard'])

const props = defineProps({
  card: Object,
  search: String,
  cardsShowRemoveButton: Boolean,
  shouldHideDate: Boolean,
  dateIsCreatedAt: Boolean,
  resultsSectionHeight: Number,
  currentCard: Object
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
  const isCardDetailsVisible = globalStore.cardDetailsIsVisibleForCardId === card.id
  return isCardDetailsVisible || card.isLoading || isCurrentCard(card)
}
const cardIsFocused = (card) => {
  return globalStore.previousResultItem.id === card.id
}
const cardDate = (card) => {
  return props.dateIsCreatedAt || card.nameUpdatedAt || card.updatedAt
}
const relativeDate = (card) => {
  const date = cardDate(card)
  return utils.shortRelativeTime(date)
}
const userIsNotCurrentUser = (userId) => {
  return userStore.id !== userId
}
const isStrikeThrough = (card) => {
  return card.name.startsWith('[x]')
}
const isThemeDark = computed(() => themeStore.getIsThemeDark)
const colorIsDark = (card) => {
  if (!card.backgroundColor) {
    return isThemeDark.value
  }
  return utils.colorIsDark(card.backgroundColor)
}
const dateIsToday = (card) => {
  const date = cardDate(card)
  if (!date) { return }
  return dayjs(date).isToday()
}
const isCurrentCard = (card) => {
  return props.currentCard?.id === card.id
}
const nameIsColor = (card) => {
  const name = card.name.trim()
  return colord(name).isValid()
}
const cardInfoStyles = (card) => {
  const styles = {}
  if (card.backgroundColor) {
    styles.backgroundColor = card.backgroundColor
  }
  if (nameIsColor(card)) {
    styles.backgroundColor = card.name
  }
  return styles
}

// [·] checkbox cards

const cardIsTodo = (card) => {
  return Boolean(utils.checkboxFromString(card.name))
}
const canEditCard = (card) => {
  return userStore.getUserCanEditCard(card)
}

</script>

<template lang="pug">
li.card-list-item(@click.stop="selectCard(card)" :data-card-id="card.id" :class="{active: cardIsActive(card), hover: cardIsFocused(card)}")
  //- date
  span.badge.status.inline-badge(v-if="!props.shouldHideDate" :class="{'date-is-today': dateIsToday(card)}")
    img.icon.time(src="@/assets/time.svg")
    span {{ relativeDate(card) }}
  //- space
  span.badge.status.inline-badge(v-if="card.space")
    span {{ card.space.name }}
  //- user
  UserLabelInline(v-if="card.user.id && userIsNotCurrentUser(card.user.id)" :user="card.user")
  //- [·]
  ItemCheckboxButton(:visible="cardIsTodo(card)" :card="card" :canEditItem="canEditCard(card)" :parentIsList="true")
  //- card info
  span.card-info(:class="{ badge: card.backgroundColor || nameIsColor(card), 'is-dark': colorIsDark(card) }" :style="cardInfoStyles(card)")
    //- name
    template(v-for="segment in card.nameSegments")
      img.card-image(v-if="segment.isImage" :src="segment.url")
      img.card-image(v-if="urlPreviewImage(card)" :src="urlPreviewImage(card)")
      NameSegment(:segment="segment" :search="props.search" :isStrikeThrough="isStrikeThrough(card)" :backgroundColorIsDark="colorIsDark(card)")
    //- remove
    button.small-button.remove-button.danger(v-if="props.cardsShowRemoveButton" @click.left.stop="removeCard(card)")
      img.icon(src="@/assets/remove.svg")
    //- loading
    Loader(:visible="card.isLoading" :isSmall="true")
</template>

<style lang="stylus">
li.card-list-item
  position relative
  display block !important
  .button-badge
    box-shadow none
    display inline-block
    margin-right 0
    pointer-events none
    &:hover,
    &:active
      box-shadow none
  img
    max-width 48px
    border-radius var(--small-entity-radius)
    vertical-align middle
  .badge.date-is-today
    background-color var(--info-background)
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
    top 8px
    left 2px
  .card-info
    &.badge
      position initial
      &.is-dark
        color var(--primary-on-dark-background)
  .strikethrough
    opacity 0.5
</style>
