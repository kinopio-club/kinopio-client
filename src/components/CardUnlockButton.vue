<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const connectionStore = useConnectionStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

let unsubscribes

onMounted(() => {
  updateDefaultColor()

  const globalStoreUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerUpdateTheme') {
        updateDefaultColor()
      }
    }
  )
  unsubscribes = () => {
    globalStoreUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

const props = defineProps({
  card: Object
})

const state = reactive({
  defaultColor: '#e3e3e3',
  position: null
})

const canEditCard = computed(() => userStore.getUserCanEditCard(props.card))
const canEditSpace = computed(() => userStore.getUserCanEditSpace)
const connectionTypes = computed(() => connectionStore.getItemConnectionTypes(props.card.id))

// theme

const updateDefaultColor = () => {
  state.defaultColor = utils.cssVariable('secondary-background')
}
const backgroundColorIsDark = computed(() => {
  const color = props.card.backgroundColor || state.defaultColor
  return utils.colorIsDark(color)
})
const isThemeDark = computed(() => userStore.theme === 'dark')
const isDarkInLightTheme = computed(() => backgroundColorIsDark.value && !isThemeDark.value)
const isLightInDarkTheme = computed(() => !backgroundColorIsDark.value && isThemeDark.value)

// styles

const positionStyles = computed(() => {
  const buttonWidth = 36
  const width = props.card.width || props.card.resizeWidth
  const x = props.card.x + width - buttonWidth
  return {
    left: x + 'px',
    top: props.card.y + 'px',
    zIndex: props.card.z
  }
})
const backgroundStyles = computed(() => {
  return { backgroundColor: 'transparent' }
})

// unlock

const unlockCard = (event) => {
  if (globalStore.currentUserIsDrawingConnection) {
    return
  }
  event.stopPropagation()
  if (!canEditCard.value || !canEditSpace.value) {
    const position = utils.cursorPositionInPage(event)
    globalStore.addNotificationWithPosition({ message: 'Card is Read Only', position, type: 'info', layer: 'space', icon: 'cancel' })
    return
  }
  globalStore.currentUserIsDraggingCard = false
  const update = {
    id: props.card.id,
    isLocked: false
  }
  cardStore.updateCard(update)
}

</script>

<template lang="pug">
.card-unlock-button.inline-button-wrap.item-unlock-button(:style="positionStyles" @mouseup.left="unlockCard" @touchend="unlockCard" :data-item-id="card.id")
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
