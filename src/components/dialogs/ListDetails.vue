<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useListStore } from '@/stores/useListStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'

import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import ItemDetailsDebug from '@/components/ItemDetailsDebug.vue'
import utils from '@/utils.js'

import { colord, extend } from 'colord'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const listStore = useListStore()
const spaceStore = useSpaceStore()
const broadcastStore = useBroadcastStore()

const dialogElement = ref(null)
const nameElement = ref(null)

const state = reactive({
  colorPickerIsVisible: false
})

let prevList

const canEditSpace = computed(() => userStore.getUserCanEditSpace)
const currentList = computed(() => {
  return listStore.getList(globalStore.listDetailsIsVisibleForListId) || {}
})
const visible = computed(() => utils.objectHasKeys(currentList.value))
watch(() => visible.value, async (value, prevValue) => {
  await nextTick()
  if (value) {
    closeDialogs()
    // broadcastShowListDetails()
    scrollIntoViewAndFocus()
    textareaSizes()
    globalStore.preventMultipleSelectedActionsIsVisible = false
    prevList = currentList.value
  } else {
    globalStore.currentDraggingListId = ''
    globalStore.updateMultipleListsSelectedIds([])
    await nextTick()
    const list = listStore.getList(prevList.id)
    listStore.updateListDimensions(list)
  }
})
const lists = computed(() => listStore.getAllLists)

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
    left: `${currentList.value.x + 8}px`,
    top: `${currentList.value.y + 8}px`
  }
  return styles
})
const broadcastShowListDetails = () => {
  const updates = {
    listId: currentList.value.id,
    userId: userStore.id
  }
  broadcastStore.update({ updates, action: 'updateRemoteListDetailsVisible' })
}
const update = (updates) => {
  const keys = Object.keys(updates)
  const update = { id: currentList.value.id }
  keys.forEach(key => {
    update[key] = updates[key]
  })
  listStore.updateList(update)
  // state.isUpdated = true
}
const sectionStyles = computed(() => {
  const backgroundColor = colord(currentList.value.color).alpha(1).toRgbString()
  return { backgroundColor }
})

// name

const name = computed({
  get () {
    return currentList.value.name
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
  // select all in new lists, else put cursor at end (like cards)
  const currentListIsNew = globalStore.currentListIsNew
  const element = nameElement.value
  const length = name.value.length
  if (length && element) {
    element.setSelectionRange(0, length)
  }
  globalStore.currentListIsNew = false
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

const itemColors = computed(() => spaceStore.getSpaceItemColors.list)
const colorisDark = computed(() => {
  const color = currentList.value.color
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

const removeList = () => {
  listStore.removeList(currentList.value.id)
  globalStore.closeAllDialogs()
}
</script>

<template lang="pug">
dialog.narrow.link-details(v-if="visible" :open="visible" :style="styles" @click.left.stop="closeDialogs" ref="dialogElement" :date-list-id="currentList.id")
  .dark-theme-background-layer(v-if="isThemeDarkAndUserColorLight")

  section(:style="sectionStyles")
    .row.info-row
      //- color
      .button-wrap
        button.change-color(:disabled="!canEditSpace" @click.left.stop="toggleColorPicker" :class="{active: state.colorPickerIsVisible}")
          .current-color(:style="{backgroundColor: currentList.color}")
        ColorPicker(
          :currentColor="currentList.color"
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
          placeholder="List Name"
          v-model="name"
          @keydown.enter.stop.prevent="closeAllDialogs"
          maxLength="600"
          :class="{'is-dark': colorisDark, 'is-light': !colorisDark}"
        )
    .row
      //- remove
      .button-wrap(v-if="canEditSpace")
        button.danger(@click.left="removeList" title="Remove List")
          img.icon(src="@/assets/remove.svg")
    ItemDetailsDebug(:item="currentList" :keys="['x', 'y', 'height', 'resizeWidth']")
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
