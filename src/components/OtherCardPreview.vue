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

// checkbox

const hasCheckbox = computed(() => {
  return utils.checkboxFromString(props.otherCard?.name)
})
const isChecked = computed(() => utils.nameIsChecked(props.otherCard?.name))
const checkboxState = computed({
  get () {
    return isChecked.value
  }
})
const toggleCardChecked = () => {
  if (store.state.currentUserIsDraggingConnectionIdLabel) { return }
  if (store.state.preventDraggedCardFromShowingDetails) { return }
  const spaceId = props.otherCard.spaceId
  const canEditSpace = store.getters['currentUser/canEditSpace']({ id: spaceId })
  if (!canEditSpace) { return }
  const value = !isChecked.value
  store.dispatch('closeAllDialogs')

  // update card in other space..
  // spaceid = props.otherCard.spaceId
  // ? store.dispatch('currentCards/toggleChecked', { cardId: props.otherCard.name, value })
  let card = {
    id: props.otherCard.id,
    name: props.otherCard.name,
    spaceId
  }

  const checkbox = utils.checkboxFromString(card.name)
  card.name = card.name.replace(checkbox, '')
  if (value) {
    card.name = `[x] ${card.name}`
  } else {
    card.name = `[] ${card.name}`
  }

  console.log('🐸', card)

  // const spaceId = otherCard.value.spaceId
  // const card = { id: otherCard.value.id, name: newName }
  // update local
  store.commit('updateCardNameInOtherItems', card)
  store.commit('triggerUpdateOtherCard', card.id)
  // updateOtherCardNameInCurrentSpace({ card, spaceId }) tODO
  // update remote
  store.dispatch('api/addToQueue', { name: 'updateCard', body: card, spaceId })

  postMessage.sendHaptics({ name: 'heavyImpact' })
  // cancelLocking()
  // emit('cancelLocking') TODO emit and handle in card.vue
  store.commit('currentUserIsDraggingCard', false)
  const userId = store.state.currentUser.id
  store.commit('broadcast/updateStore', { updates: { userId }, type: 'clearRemoteCardsDragging' })
  event.stopPropagation()
}

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
  const checkbox = utils.checkboxFromString(card.name)
  if (checkbox) {
    card.name = card.name.replace(checkbox, '')
  }
  card = store.getters['currentCards/nameSegments'](card)
  card.nameSegments = card.nameSegments.map(segment => {
    if (segment.isLink) {
      segment.isLink = false
      segment.isText = true
      segment.content = segment.name
    } else if (segment.isText) {
      segment.markdown = utils.markdownSegments(segment.content)
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
    :data-checkbox="hasCheckbox"
  )
    template(v-if="props.otherCard")
      //- removed
      template(v-if="props.otherCard.isRemoved")
        span.badge.danger
          img.icon(src="@/assets/remove.svg")
      //- .row
      //- [·]
      .checkbox-wrap(v-if="hasCheckbox" @mouseup.left.stop="toggleCardChecked" @touchend.prevent.stop="toggleCardChecked" @click.stop)
        label(:class="{active: isChecked, disabled: !canEditSpace}")
          input(name="checkbox" type="checkbox" v-model="checkboxState")
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

  .checkbox-wrap
    padding-top 8px
    padding-left 8px
    padding-bottom 8px
    // display inline-block
    label
      pointer-events none
      width 20px
      height 16px
      display flex
      align-items center
      padding-left 4px
      padding-right 4px
      input
        margin 0
        margin-top -1px
        width 10px
        height 10px
        background-size contain

</style>
