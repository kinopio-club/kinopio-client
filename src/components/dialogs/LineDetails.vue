<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useLineStore } from '@/stores/useLineStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'

import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import ItemDetailsDebug from '@/components/ItemDetailsDebug.vue'
import utils from '@/utils.js'

import { colord, extend } from 'colord'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const lineStore = useLineStore()
const spaceStore = useSpaceStore()
const broadcastStore = useBroadcastStore()

const dialogElement = ref(null)
const nameElement = ref(null)

const state = reactive({
  colorPickerIsVisible: false
})

const canEditSpace = computed(() => userStore.getUserCanEditSpace)
const currentLine = computed(() => {
  return lineStore.getLine(globalStore.lineDetailsIsVisibleForLineId) || {}
})
const visible = computed(() => utils.objectHasKeys(currentLine.value))
watch(() => visible.value, async (value, prevValue) => {
  await nextTick()
  if (value) {
    closeDialogs()
    // broadcastShowLineDetails()
    scrollIntoViewAndFocus()
    textareaSizes()
    globalStore.preventMultipleSelectedActionsIsVisible = false
  } else {
    globalStore.currentDraggingLineId = ''
    globalStore.updateMultipleLinesSelectedIds([])
  }
})
const lines = computed(() => lineStore.getAllLines)

// dialog state

const closeDialogs = () => {
  state.colorPickerIsVisible = false
}
const closeAllDialogs = () => {
  globalStore.closeAllDialogs()
}
const blur = () => {
  globalStore.triggerUpdateHeaderAndFooterPosition()
}
const scrollIntoView = async () => {
  await nextTick()
  const element = dialogElement.value
  await nextTick()
  globalStore.scrollElementIntoView({ element })
}
const scrollIntoViewAndFocus = async () => {
  let behavior
  if (utils.isIPhone()) {
    behavior = 'auto'
  }
  await nextTick()
  scrollIntoView(behavior)
  focusName()
}

// styles

const styles = computed(() => {
  let zoom = globalStore.getSpaceCounterZoomDecimal
  if (utils.isAndroid()) {
    zoom = utils.visualViewport().scale
  } else if (globalStore.isTouchDevice) {
    // on iOS, keyboard focus zooms
    zoom = 1
  }
  const styles = {
    transform: `scale(${zoom})`,
    left: `${currentLine.value.x + 8}px`,
    top: `${currentLine.value.y + 8}px`
  }
  return styles
})
const broadcastShowLineDetails = () => {
  const updates = {
    lineId: currentLine.value.id,
    userId: userStore.id
  }
  broadcastStore.update({ updates, action: 'updateRemoteLineDetailsVisible' })
}
const update = (updates) => {
  const keys = Object.keys(updates)
  const update = { id: currentLine.value.id }
  keys.forEach(key => {
    update[key] = updates[key]
  })
  lineStore.updateLine(update)
  // state.isUpdated = true
}
const sectionStyles = computed(() => {
  const backgroundColor = colord(currentLine.value.color).alpha(1).toRgbString()
  return { backgroundColor }
})

// name

const name = computed({
  get () {
    return currentLine.value.name
  },
  set (name) {
    update({ name })
    textareaSizes()
  }
})
const focusName = async () => {
  await nextTick()
  const element = nameElement.value
  const length = name.value.length
  utils.focusTextarea(element)
  selectName()
  globalStore.triggerUpdateHeaderAndFooterPosition()
}
const selectName = () => {
  // select all in new lines, else put cursor at end (like cards)
  const currentLineIsNew = globalStore.currentLineIsNew
  const element = nameElement.value
  const length = name.value.length
  if (length && element) {
    element.setSelectionRange(0, length)
  }
  globalStore.currentLineIsNew = false
}
const textareaSizes = () => {
  const element = dialogElement.value
  const textarea = element.querySelector('textarea')
  let modifier = 0
  if (canEditSpace.value) {
    modifier = 1
  }
  textarea.style.height = textarea.scrollHeight + modifier + 'px'
}

// colors

const itemColors = computed(() => spaceStore.getSpaceItemColors.line)
const colorisDark = computed(() => {
  const color = currentLine.value.color
  return utils.colorIsDark(color)
})
const toggleColorPicker = () => {
  const value = !state.colorPickerIsVisible
  closeDialogs()
  state.colorPickerIsVisible = value
}
const updateColor = (color) => {
  update({ color })
}
const isThemeDarkAndUserColorLight = computed(() => {
  const isThemeDark = userStore.theme === 'dark'
  return isThemeDark && !colorisDark.value
})

// remove

const removeLine = () => {
  lineStore.removeLine(currentLine.value.id)
  globalStore.closeAllDialogs()
}

// jump to

const nextLine = computed(() => lineStore.getNextLine(currentLine.value.y))
const prevLine = computed(() => lineStore.getPrevLine(currentLine.value.y))
const focusLine = (line) => {
  globalStore.updateFocusOnLineId(line.id)
  globalStore.updateLineDetailsIsVisibleForLineId(line.id)
}
</script>

<template lang="pug">
dialog.narrow.link-details(v-if="visible" :open="visible" :style="styles" @click.left.stop="closeDialogs" ref="dialogElement" :date-line-id="currentLine.id")
  .dark-theme-background-layer(v-if="isThemeDarkAndUserColorLight")

  section(:style="sectionStyles")
    .row.info-row
      //- color
      .button-wrap
        button.change-color(:disabled="!canEditSpace" @click.left.stop="toggleColorPicker" :class="{active: state.colorPickerIsVisible}")
          .current-color(:style="{backgroundColor: currentLine.color}")
        ColorPicker(
          :currentColor="currentLine.color"
          :visible="state.colorPickerIsVisible"
          :recentColors="itemColors"
          :luminosityIsDark="true"
          @selectedColor="updateColor"
        )
      //- name
      .textarea-wrap
        textarea.name(
          :disabled="!canEditSpace"
          ref="nameElement"
          rows="1"
          placeholder="Line Name"
          v-model="name"
          @keydown.enter.stop.prevent="closeAllDialogs"
          maxLength="600"
          :class="{'is-dark': colorisDark, 'is-light': !colorisDark}"
        )
    .row
      //- remove
      .button-wrap(v-if="canEditSpace")
        button.danger(@click.left="removeLine" title="Remove Line")
          img.icon(src="@/assets/remove.svg")
      //- jump to
      .button-wrap
        .segmented-buttons
          button(@click.left="focusLine(prevLine)" :disabled="!prevLine" title="Jump to Previous Line")
            img.icon.down-arrow.up-arrow(src="@/assets/down-arrow.svg")
          button(@click.left="focusLine(nextLine)" :disabled="!nextLine" title="Jump to Next Line")
            img.icon.down-arrow(src="@/assets/down-arrow.svg")
    ItemDetailsDebug(:item="currentLine" :keys="['y', 'color']")
</template>

<style lang="stylus">
dialog.link-details
  transform-origin top left
  textarea.name
    margin-left 6px
    margin-top 2px
    margin-bottom 0
    width calc(100% - 6px)
    border-color var(--primary-border)
    &.is-dark
      color var(--primary-on-dark-background)
      border-color var(--primary-border-on-dark-background)
    &.is-light
      color var(--primary-on-light-background)
      border-color var(--primary-border-on-light-background)
  .info-row
    align-items flex-start
  .up-arrow
    transform rotate(180deg)
  .down-arrow
    padding 0
    vertical-align 3px
</style>
