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
const connectionTypes = computed(() => store.getters['currentConnections/typesByItemId'](props.card.id))

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

const positionStyles = computed(() => {
  const buttonWidth = 36
  const width = props.card.width || props.card.resizeWidth
  const x = props.card.x + width - buttonWidth
  return {
    left: x + 'px',
    top: props.card.y + 'px'
  }
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
  const update = {
    id: props.card.id,
    isLocked: false
  }
  store.dispatch('currentCards/update', { card: update })
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
