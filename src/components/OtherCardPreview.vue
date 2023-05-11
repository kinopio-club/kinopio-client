<script setup>
import Loader from '@/components/Loader.vue'
import NameSegment from '@/components/NameSegment.vue'
import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const props = defineProps({
  otherCard: Object,
  url: String,
  parentCardId: String,
  shouldCloseAllDialogs: Boolean,
  shouldTruncateName: Boolean
})
const state = reactive({
  nameSegments: []
})

onMounted(() => {
  updateNameSegments()
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerUpdateOtherCard') {
      if (mutation.payload !== props.otherCard.id) { return }
      updateNameSegments()
    }
  })
})

const isLoadingOtherItems = computed(() => store.state.isLoadingOtherItems)

const isActive = computed(() => {
  const isFromParentCard = store.state.currentSelectedOtherItem.parentCardId === props.parentCardId
  const otherCardDetailsIsVisible = store.state.otherCardDetailsIsVisible
  return otherCardDetailsIsVisible && isFromParentCard
})

// update card
watch(() => store.state.isLoadingOtherItems, (value, prevValue) => {
  if (!value) {
    updateNameSegments()
  }
})
watch(() => props.otherCard, (value, prevValue) => {
  if (value) {
    updateNameSegments()
  }
})
const updateNameSegments = () => {
  if (!props.otherCard) { return }
  let card = utils.clone(props.otherCard)
  if (props.shouldTruncateName) {
    card.name = utils.truncated(card.name, 25)
  }
  card = store.getters['currentCards/nameSegments'](card)
  card.nameSegments = card.nameSegments.map(segment => {
    if (segment.isLink) {
      segment.isLink = false
      segment.isText = true
      segment.content = segment.name
    }
    return segment
  })
  state.nameSegments = card.nameSegments
  store.dispatch('currentCards/updateDimensions', { cards: [{ id: props.parentCardId }] })
}

// dialog
const showOtherCardDetailsIsVisible = (event) => {
  if (utils.isMultiTouch(event)) { return }
  if (store.state.preventDraggedCardFromShowingDetails) { return }
  let otherItem = {}
  if (props.otherCard) {
    otherItem = utils.clone(props.otherCard)
  }
  if (props.parentCardId) {
    otherItem.parentCardId = props.parentCardId
    store.dispatch('currentCards/incrementZ', props.parentCardId)
  }
  if (props.shouldCloseAllDialogs) {
    store.dispatch('closeAllDialogs')
  }
  store.commit('currentUserIsDraggingCard', false)
  const position = utils.cursorPositionInSpace(event)
  store.commit('otherItemDetailsPosition', position)
  store.commit('currentSelectedOtherItem', otherItem)
  store.commit('otherCardDetailsIsVisible', true)
  store.commit('triggerCancelLocking')
  store.commit('currentUserIsDraggingCard', false)
  store.commit('otherSpaceDetailsIsVisible', false)
  event.stopPropagation()
}

</script>

<template lang="pug">
a.other-card-preview(@click.prevent.stop :href="props.url")
  .badge.button-badge.link-badge(:class="{ active: isActive }" @mouseup.prevent="showOtherCardDetailsIsVisible($event)" @touchend.prevent="showOtherCardDetailsIsVisible($event)")
    template(v-if="props.otherCard")
      template(v-for="segment in state.nameSegments")
        img.card-image(v-if="segment.isImage" :src="segment.url")
        NameSegment(:segment="segment")
    template(v-else)
      Loader(:visible="true" :isSmall="true" :isStatic="!isLoadingOtherItems")
      span Card

</template>

<style lang="stylus">
.other-card-preview
  display block
  text-decoration none
  word-wrap break-word
  .link-badge
    display block
    margin 0
  .card-image
    vertical-align middle
    border-radius var(--entity-radius)
    max-height 100px
    display block
    margin 4px 0px
  .tag
    display inline-block
    pointer-events none
  .badge
    > .loader
      vertical-align -2px

</style>
