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

  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerUpdateTheme') {
        updateDefaultColor()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
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
const connections = computed(() => connectionStore.getConnectionsByItemId(props.card.id))

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
  let buttonsWidth = 34
  if (props.card.urlPreviewUrl) {
    buttonsWidth += 22
  }
  const xOffset = 2
  const width = props.card.width || props.card.resizeWidth
  const x = props.card.x + width - buttonsWidth + xOffset
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
.card-unlock-buttons.inline-button-wrap.item-unlock-button(:style="positionStyles" @mouseup.left="unlockCard" @touchend="unlockCard" :data-item-id="card.id")
  //- url link
  a.url-wrap(v-if="props.card.urlPreviewUrl" :href="props.card.urlPreviewUrl" @mouseup.exact.prevent.stop @click.stop @touchend.prevent target="_blank")
    .url.inline-button-wrap
      button.inline-button.url-button(tabindex="-1" :style="backgroundStyles" :class="{'is-light-in-dark-theme': isLightInDarkTheme, 'is-dark-in-light-theme': isDarkInLightTheme}")
        img.icon.visit.arrow-icon(src="@/assets/visit.svg")
  //- unlock
  .inline-button-wrap
    button.inline-button.lock-button(tabindex="-1" :style="backgroundStyles" :class="{'is-light-in-dark-theme': isLightInDarkTheme, 'is-dark-in-light-theme': isDarkInLightTheme}")
      .connected-colors
        template(v-for="connection in connections" :key="connection.id")
          .color(:style="{ background: connection.color}")
      img.icon.lock-icon(src="@/assets/lock.svg")
</template>

<style lang="stylus">
.card-unlock-buttons
  transform-origin top left
  pointer-events all
  cursor pointer
  position absolute
  padding 0
  display flex
  button
    cursor pointer
    padding 5px 8px
  .lock-button
    width fit-content
    &:hover
      .lock-icon
        opacity 1
  .lock-icon
    position absolute
    left 4px
    top 2px
    height 10px
    opacity 0.3
  .arrow-icon
    position absolute
    left 5px
    top 3.5px
    opacity 0.3

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

  .url-wrap
    padding 0
    margin 0
    vertical-align -1px
    .url
      display inline-block
      cursor pointer
      padding-left 0
      padding-right 0
      button
        cursor pointer
    &:hover
      .arrow-icon
        opacity 1
</style>
