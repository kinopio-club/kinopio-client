<script setup>
import Loader from '@/components/Loader.vue'
import NameSegment from '@/components/NameSegment.vue'
import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

onMounted(() => {
  updateNameSegments()
  updatePrimaryBackgroundColor()
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerUpdateOtherCard') {
      if (!props.otherCard) { return }
      if (mutation.payload !== props.otherCard.id) { return }
      updateNameSegments()
    } else if (mutation.type === 'triggerUpdateTheme') {
      updatePrimaryBackgroundColor()
    }
  })
  window.addEventListener('touchend', disableIsActive)
  window.addEventListener('mouseup', disableIsActive)
})
watch(() => store.state.preventDraggedCardFromShowingDetails, (value, prevValue) => {
  disableIsActive()
})

const props = defineProps({
  otherCard: Object,
  url: String,
  parentCardId: String,
  shouldCloseAllDialogs: Boolean,
  shouldTruncateName: Boolean,
  isSelected: Boolean,
  selectedColor: String
})

const state = reactive({
  nameSegments: [],
  primaryBackgroundColor: '',
  isActive: null
})

const isLoadingOtherItems = computed(() => store.state.isLoadingOtherItems)
const isActive = computed(() => {
  const isFromParentCard = store.state.currentSelectedOtherItem.parentCardId === props.parentCardId
  const otherCardDetailsIsVisible = store.state.otherCardDetailsIsVisible
  return otherCardDetailsIsVisible && isFromParentCard
})
const updatePrimaryBackgroundColor = () => {
  state.primaryBackgroundColor = utils.cssVariable('primary-background')
}
const background = computed(() => props.selectedColor || props.otherCard.backgroundColor)
const backgroundColorIsDark = computed(() => {
  let color = background.value || state.primaryBackgroundColor
  return utils.colorIsDark(color)
})
const styles = computed(() => {
  if (!props.otherCard) { return }
  const isThemeDark = store.getters['themes/isThemeDark']
  let color = utils.cssVariable('primary-on-light-background')
  if (isThemeDark) {
    color = utils.cssVariable('primary-on-dark-background')
  }
  if (backgroundColorIsDark.value) {
    color = utils.cssVariable('primary-on-dark-background')
  }
  return {
    color,
    background: background.value
  }
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
}

// otherCardDetails

const showOtherCardDetailsIsVisible = async (event) => {
  state.isActive = false
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
  event.stopPropagation()
  // broadcast
  const updates = {
    userId: store.state.currentUser.id,
    cardId: props.parentCardId
  }
  store.commit('broadcast/updateStore', { updates, type: 'clearRemoteCardsDragging' })
  await nextTick()
  store.commit('broadcast/updateStore', { updates, type: 'updateRemoteCardDetailsVisible' })
}
const disableIsActive = () => {
  state.isActive = false
}
const enableIsActive = () => {
  state.isActive = true
}
</script>

<template lang="pug">
a.other-card-preview(@click.prevent.stop :href="props.url")
  .badge.button-badge.link-badge.badge-card-button(
    :class="{ active: state.isActive }"
    :style="styles"
    @mousedown.left="enableIsActive"
    @touchstart="enableIsActive"
    @mouseup.prevent="showOtherCardDetailsIsVisible($event)"
    @touchend.prevent="showOtherCardDetailsIsVisible($event)"
  )
    template(v-if="props.otherCard")
      //- removed
      template(v-if="props.otherCard.isRemoved")
        span.badge.danger
          img.icon(src="@/assets/remove.svg")
      //- name
      template(v-for="segment in state.nameSegments")
        img.card-image(v-if="segment.isImage" :src="segment.url")
        NameSegment(:segment="segment" :backgroundColorIsDark="backgroundColorIsDark")
    template(v-else)
      Loader(:visible="true" :isSmall="true" :isStatic="!isLoadingOtherItems")
      span Card

</template>

<style lang="stylus">
.other-card-preview
  display block
  text-decoration none
  word-wrap break-word
  width 100%
  .link-badge
    display block
    margin 0
  .card-image
    vertical-align middle
    border-radius var(--entity-radius)
    display block
    margin 4px 0px
  .tag
    display inline-block
    pointer-events none
  .badge
    > .loader
      vertical-align -2px
  .badge-card-button
    &:hover
      span
        text-decoration none !important
</style>
