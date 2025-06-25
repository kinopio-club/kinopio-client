<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'

import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import CardOrBoxActions from '@/components/subsections/CardOrBoxActions.vue'
import ItemCheckboxButton from '@/components/ItemCheckboxButton.vue'
import BackgroundPicker from '@/components/dialogs/BackgroundPicker.vue'
import BackgroundPreview from '@/components/BackgroundPreview.vue'
import ItemDetailsDebug from '@/components/ItemDetailsDebug.vue'
import utils from '@/utils.js'

import { colord, extend } from 'colord'

const globalStore = useGlobalStore()
const boxStore = useBoxStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const broadcastStore = useBroadcastStore()

const dialogElement = ref(null)
const nameElement = ref(null)

let prevBoxId

const state = reactive({
  colorPickerIsVisible: false,
  isUpdated: false,
  backgroundPickerIsVisible: false
})

const spaceCounterZoomDecimal = computed(() => globalStore.getSpaceCounterZoomDecimal)
const canEditBox = computed(() => userStore.getUserCanEditBox(currentBox.value))
const id = computed(() => globalStore.boxDetailsIsVisibleForBoxId)
// box state

const currentBox = computed(() => {
  return boxStore.getBox(id.value) || {}
})
watch(() => id.value, async (value, prevValue) => {
  await nextTick()
  // open
  if (value) {
    prevBoxId = value.id
    closeDialogs()
    broadcastShowBoxDetails()
    scrollIntoViewAndFocus()
    textareaSizes()
  // close
  } else {
    if (!state.isUpdated) { return }
    state.isUpdated = false
  }
})

const visible = computed(() => utils.objectHasKeys(currentBox.value))
watch(() => visible.value, async (value, prevValue) => {
  await nextTick()
  if (!value) {
    globalStore.currentDraggingBoxId = ''
    globalStore.updateMultipleBoxesSelectedIds([])
    globalStore.preventMultipleSelectedActionsIsVisible = false
  }
})

const broadcastShowBoxDetails = () => {
  const updates = {
    boxId: currentBox.value.id,
    userId: userStore.id
  }
  broadcastStore.update({ updates, action: 'updateRemoteBoxDetailsVisible' })
}
const update = (updates) => {
  const keys = Object.keys(updates)
  const update = { id: currentBox.value.id }
  keys.forEach(key => {
    update[key] = updates[key]
  })
  boxStore.updateBox(update)
  boxStore.updateBoxInfoDimensions(update)
  state.isUpdated = true
}

// styles

const styles = computed(() => {
  let zoom = spaceCounterZoomDecimal.value
  if (globalStore.isTouchDevice) {
    zoom = utils.pinchCounterZoomDecimal()
  }
  const backgroundColor = colord(currentBox.value.color).alpha(1).toRgbString()
  const styles = {
    transform: `scale(${zoom})`,
    left: `${currentBox.value.x + 8}px`,
    top: `${currentBox.value.y + 8}px`,
    backgroundColor
  }
  return styles
})

// name

const name = computed({
  get () {
    return currentBox.value.name
  },
  set (name) {
    update({ name })
    textareaSizes()
  }
})
const focusName = async () => {
  await nextTick()
  const element = nameElement.value
  if (!element) { return }
  element.focus()
}
const selectName = () => {
  // select all in new boxes, else put cursor at end (like cards)
  const currentBoxIsNew = globalStore.currentBoxIsNew
  const element = nameElement.value
  const length = name.value.length
  if (length && element) {
    element.setSelectionRange(0, length)
  }
  globalStore.currentBoxIsNew = false
}
const textareaSizes = () => {
  const element = dialogElement.value
  const textarea = element.querySelector('textarea')
  let modifier = 0
  if (canEditBox.value) {
    modifier = 1
  }
  textarea.style.height = textarea.scrollHeight + modifier + 'px'
}

// text edit actions

const selectionStartPosition = () => {
  if (!nameElement.value) { return }
  const startPosition = nameElement.value.selectionStart
  return startPosition
}
const selectionEndPosition = () => {
  if (!nameElement.value) { return }
  const endPosition = nameElement.value.selectionEnd
  return endPosition
}
const setSelectionRange = (start, end) => {
  if (nameElement.value) {
    nameElement.value.setSelectionRange(start, end)
  }
}
const toggleTextEditAction = async (action) => {
  if (!visible.value) { return }
  const startPosition = selectionStartPosition()
  const endPosition = selectionEndPosition()
  const { newName, offset } = utils.nameTextEditAction({
    action,
    startPosition,
    endPosition,
    name: nameElement.value.value
  })
  update({ name: newName })
  textareaSizes()
  await nextTick()
  setSelectionRange(startPosition + offset, endPosition + offset)
}

// colors

const itemColors = computed(() => spaceStore.getSpaceItemColors)
const colorisDark = computed(() => {
  const color = currentBox.value.color
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

// background

const toggleBackgroundPickerIsVisible = () => {
  const value = !state.backgroundPickerIsVisible
  closeDialogs()
  state.backgroundPickerIsVisible = value
}

// remove

const removeBox = () => {
  boxStore.removeBox(currentBox.value.id)
}

// dialog state

const closeDialogs = () => {
  state.colorPickerIsVisible = false
  state.backgroundPickerIsVisible = false
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
  scrollIntoView()
  if (utils.isMobile()) { return }
  await nextTick()
  focusName()
  selectName()
}

// filter

const isFilteredInSpace = computed({
  get () {
    const boxIds = globalStore.filteredBoxIds
    return boxIds.includes(currentBox.value.id)
  },
  set () {
    toggleFilteredInSpace()
  }
})
const toggleFilteredInSpace = () => {
  const filtered = globalStore.filteredBoxIds
  const boxId = currentBox.value.id
  if (filtered.includes(boxId)) {
    globalStore.removeFromFilteredBoxId(boxId)
  } else {
    globalStore.addToFilteredBoxId(boxId)
  }
}
</script>

<template lang="pug">
dialog.narrow.box-details(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialogElement" :style="styles" :data-box-id="currentBox.id")
  .dark-theme-background-layer(v-if="isThemeDarkAndUserColorLight")
  section
    .row.info-row
      //- color
      .button-wrap
        button.change-color(:disabled="!canEditBox" @click.left.stop="toggleColorPicker" :class="{active: state.colorPickerIsVisible}")
          .current-color(:style="{backgroundColor: currentBox.color}")
        ColorPicker(
          :currentColor="currentBox.color"
          :visible="state.colorPickerIsVisible"
          :recentColors="itemColors"
          :luminosityIsDark="true"
          @selectedColor="updateColor"
        )
      //- name
      .textarea-wrap
        textarea.name(
          :disabled="!canEditBox"
          ref="nameElement"
          rows="1"
          placeholder="Box Name"
          v-model="name"
          @keydown.enter.stop.prevent="closeAllDialogs"
          maxLength="600"
          :class="{'is-dark': colorisDark, 'is-light': !colorisDark}"
          @keydown.meta.b.exact.stop.prevent="toggleTextEditAction('bold')"
          @keydown.ctrl.b.exact.stop.prevent="toggleTextEditAction('bold')"
          @keydown.meta.i.exact.stop.prevent="toggleTextEditAction('italic')"
          @keydown.ctrl.i.exact.stop.prevent="toggleTextEditAction('italic')"
        )
      //- Filter
      .button-wrap.filter-button-wrap
        button.small-button(@click.left.prevent="toggleFilteredInSpace" @keydown.stop.enter="toggleFilteredInSpace" :class="{active: isFilteredInSpace}")
          img.icon(src="@/assets/filter.svg")

    .row(v-if="canEditBox")
      //- remove
      .button-wrap
        button.danger(@click.left="removeBox")
          img.icon(src="@/assets/remove.svg")
      //- [·]
      ItemCheckboxButton(:boxes="[currentBox]" :isDisabled="!canEditBox")
      .button-wrap.background-preview-wrap(@click.left.stop="toggleBackgroundPickerIsVisible")
        BackgroundPreview(:box="currentBox" :isButton="true" :buttonIsActive="state.backgroundPickerIsVisible")
        BackgroundPicker(:visible="state.backgroundPickerIsVisible" :box="currentBox")
    ItemDetailsDebug(:item="currentBox" :keys="['infoWidth']")

    CardOrBoxActions(:visible="canEditBox" :boxes="[currentBox]" @closeDialogs="closeDialogs" :colorIsHidden="true")
    .row(v-if="!canEditBox")
      span.badge.info
        img.icon(src="@/assets/unlock.svg")
        span Read Only
</template>

<style lang="stylus">
.box-details
  transform-origin top left
  textarea.name
    margin-left 6px
    margin-top 2px
    margin-bottom 0
    width calc(100% - 6px)
    border-color var(--primary-border)
    &.is-dark
      color var(--primary-on-dark-background)
    &.is-light
      color var(--primary-on-light-background)
  .info-row
    align-items flex-start
  .filter-button-wrap
    padding-left 5px
    padding-top 1px
  .background-preview-wrap
    height var(--button-fixed-height)
</style>
