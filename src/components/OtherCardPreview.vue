<script setup>
import Loader from '@/components/Loader.vue'
import NameSegment from '@/components/NameSegment.vue'
import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const props = defineProps({
  otherCardId: String,
  otherSpaceId: String,
  parentCardId: String,
  shouldCloseAllDialogs: Boolean
})
const state = reactive({
  otherCard: undefined,
  nameSegments: []
})

const isLoadingOtherItems = computed(() => store.state.isLoadingOtherItems)
const url = computed(() => utils.urlFromSpaceAndCard({ cardId: props.otherCardId, spaceId: props.otherSpaceId }))

const isActive = computed(() => {
  const isFromParentCard = store.state.currentSelectedOtherItem.parentCardId === props.parentCardId
  const otherCardDetailsIsVisible = store.state.otherCardDetailsIsVisible
  return otherCardDetailsIsVisible && isFromParentCard
})

// update card
watch(() => store.state.isLoadingOtherItems, (value, prevValue) => {
  if (!value) {
    let otherCard = store.getters.otherCardById(props.otherCardId)
    if (!otherCard) { return }
    state.otherCard = otherCard
    updateNameSegments()
  }
})
const updateNameSegments = () => {
  const card = store.getters['currentCards/nameSegments'](state.otherCard)
  state.nameSegments = card.nameSegments
}

// dialog
const showOtherCardDetailsIsVisible = (event) => {
  if (utils.isMultiTouch(event)) { return }
  if (store.state.preventDraggedCardFromShowingDetails) { return }
  let otherItem = {}
  if (state.otherCard) {
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
}

</script>

<template lang="pug">
a.other-card-preview(:href="url")
  .badge.button-badge.link-badge(:class="{ active: isActive }" @click.stop.prevent="showOtherCardDetailsIsVisible($event)")
    template(v-if="state.otherCard")
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
  .badge
    > .loader
      vertical-align -2px

</style>
