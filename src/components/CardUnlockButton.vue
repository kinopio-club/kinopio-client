<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
const store = useStore()

onMounted(() => {
  store.subscribe(async (mutation, state) => {
    const { type, payload } = mutation
    if (type === 'triggerUpdateTheme') {
      updateDefaultColor()
    } else if (type === 'triggerUpdateLockedItemButtonPositionCardId' && payload === props.card.id) {
      updatePosition()
    } else if (type === 'spaceZoomPercent' || type === 'zoomOrigin') {
      await nextTick()
      updatePosition()
    }
  })
  updateDefaultColor()
})

const props = defineProps({
  card: Object
})

const state = reactive({
  defaultColor: '#e3e3e3',
  position: null
})

const canEditCard = computed(() => store.getters['currentUser/canEditCard'](props.card))
const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())
const connectionTypes = computed(() => store.getters['currentConnections/typesByCardId'](props.card.id))

// theme

const updateDefaultColor = () => {
  state.defaultColor = utils.cssVariable('secondary-background')
}
const backgroundColorIsDark = computed(() => {
  const color = props.card.backgroundColor || state.defaultColor
  return utils.colorIsDark(color)
})
const isThemeDark = computed(() => store.state.currentUser.theme === 'dark')
const isDarkInLightTheme = computed(() => backgroundColorIsDark.value && !isThemeDark.value)
const isLightInDarkTheme = computed(() => !backgroundColorIsDark.value && isThemeDark.value)

// styles

const updatePosition = () => {
  let cardElement = document.querySelector(`article[data-card-id="${props.card.id}"]`)
  if (!cardElement) { return }
  if (cardElement.dataset.shouldRender === 'false') {
    return
  }
  const element = cardElement.querySelector('.lock-button-wrap')
  if (!element) { return }
  const rect = element.getBoundingClientRect()
  state.position = rect
}
const positionStyles = computed(() => {
  const pointIsEmpty = utils.pointIsEmpty(state.position)
  if (!state.position || pointIsEmpty) {
    return { display: 'none' }
  }
  let position = utils.updatePositionWithSpaceOffset(state.position)
  const x = (position.x + window.scrollX) * store.getters.spaceCounterZoomDecimal
  const y = (position.y + window.scrollY) * store.getters.spaceCounterZoomDecimal
  position = {
    left: x + 'px',
    top: y + 'px'
  }
  return position
})
const backgroundStyles = computed(() => {
  return { backgroundColor: 'transparent' }
})

// unlock

const unlockCard = (event) => {
  if (store.state.currentUserIsDrawingConnection) {
    return
  }
  event.stopPropagation()
  if (!canEditCard.value || !canEditSpace.value) {
    const position = utils.cursorPositionInPage(event)
    store.commit('addNotificationWithPosition', { message: 'Card is Read Only', position, type: 'info', layer: 'space', icon: 'cancel' })
    return
  }
  store.commit('currentUserIsDraggingCard', false)
  store.dispatch('currentCards/update', {
    id: props.card.id,
    isLocked: false
  })
}

</script>

<template lang="pug">
.card-unlock-button.inline-button-wrap(:style="positionStyles" @mouseup.left="unlockCard" @touchend="unlockCard" :data-card-id="card.id")
  button.inline-button(tabindex="-1" :style="backgroundStyles" :class="{'is-light-in-dark-theme': isLightInDarkTheme, 'is-dark-in-light-theme': isDarkInLightTheme}")
    .connected-colors
      template(v-for="type in connectionTypes" :key="type.id")
        .color(:style="{ background: type.color}")
    img.icon.lock-icon(src="@/assets/lock.svg")
</template>

<style lang="stylus">
.card-unlock-button
  transform-origin top left
  pointer-events all
  cursor pointer
  position absolute
  button
    cursor pointer
  .lock-icon
    position absolute
    left 5.5px
    top 2px
    height 10px
  // from Card.vue
  .connected-colors
    position absolute
    left 0
    top 0
    display flex
    height 100%
    width 100%
    border-radius calc(var(--entity-radius) - 1px)
    overflow hidden
    .color
      width 100%
  .is-light-in-dark-theme
    border-color var(--primary-on-light-background)
    .icon
      filter none
  .is-dark-in-light-theme
    border-color var(--primary-on-dark-background)
    .icon
      filter invert()

</style>
