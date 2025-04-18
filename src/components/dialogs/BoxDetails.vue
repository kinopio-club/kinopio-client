<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import CardOrBoxActions from '@/components/subsections/CardOrBoxActions.vue'
import ItemCheckboxButton from '@/components/ItemCheckboxButton.vue'
import BackgroundPicker from '@/components/dialogs/BackgroundPicker.vue'
import BackgroundPreview from '@/components/BackgroundPreview.vue'
import utils from '@/utils.js'

import { colord, extend } from 'colord'

const store = useStore()

const dialogElement = ref(null)
const nameElement = ref(null)

let prevBoxId

const state = reactive({
  colorPickerIsVisible: false,
  isUpdated: false,
  backgroundPickerIsVisible: false
})

const spaceCounterZoomDecimal = computed(() => store.getters.spaceCounterZoomDecimal)
const canEditBox = computed(() => store.getters['currentUser/canEditBox'](currentBox.value))

// box state

const currentBox = computed(() => {
  const id = store.state.boxDetailsIsVisibleForBoxId
  return store.getters['currentBoxes/byId'](id) || {}
})
watch(() => currentBox.value, async (value, prevValue) => {
  await nextTick()
  // open
  if (visible.value) {
    store.dispatch('history/pause')
    prevBoxId = value.id
    closeDialogs()
    broadcastShowBoxDetails()
    scrollIntoViewAndFocus()
    textareaSizes()
  // close
  } else {
    store.dispatch('history/resume')
    if (!state.isUpdated) { return }
    state.isUpdated = false
    const box = store.getters['currentBoxes/byId'](prevBoxId)
    store.dispatch('currentBoxes/updateInfoDimensions', { boxes: [box] })
    if (!box) { return }
    store.dispatch('history/add', { boxes: [box], useSnapshot: true })
  }
})

const visible = computed(() => utils.objectHasKeys(currentBox.value))
watch(() => visible.value, async (value, prevValue) => {
  await nextTick()
  if (!value) {
    store.commit('currentDraggingBoxId', '')
    store.dispatch('multipleBoxesSelectedIds', [])
    store.commit('preventMultipleSelectedActionsIsVisible', false)
    store.dispatch('currentBoxes/updateInfoDimensions', { boxes: [{ id: prevBoxId }] })
  }
})

const broadcastShowBoxDetails = () => {
  const updates = {
    boxId: currentBox.value.id,
    userId: store.state.currentUser.id
  }
  store.commit('broadcast/updateStore', { updates, type: 'updateRemoteBoxDetailsVisible' })
}
const update = (updates) => {
  const keys = Object.keys(updates)
  const box = { id: currentBox.value.id }
  keys.forEach(key => {
    box[key] = updates[key]
  })
  store.dispatch('currentBoxes/update', box)
  state.isUpdated = true
}

// styles

const styles = computed(() => {
  let zoom = spaceCounterZoomDecimal.value
  if (store.state.isTouchDevice) {
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
  const currentBoxIsNew = store.state.currentBoxIsNew
  const element = nameElement.value
  const length = name.value.length
  if (length && element) {
    element.setSelectionRange(0, length)
  }
  store.commit('currentBoxIsNew', false)
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

const itemColors = computed(() => store.getters['currentSpace/itemColors'])
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
  const isThemeDark = store.state.currentUser.theme === 'dark'
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
  store.dispatch('history/resume')
  store.dispatch('currentBoxes/remove', currentBox.value)
}

// dialog state

const closeDialogs = () => {
  state.colorPickerIsVisible = false
  state.backgroundPickerIsVisible = false
}
const closeAllDialogs = () => {
  store.dispatch('closeAllDialogs')
}
const blur = () => {
  store.commit('triggerUpdateHeaderAndFooterPosition')
}
const scrollIntoView = async () => {
  await nextTick()
  const element = dialogElement.value
  await nextTick()
  store.commit('scrollElementIntoView', { element })
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
    const boxIds = store.state.filteredBoxIds
    return boxIds.includes(currentBox.value.id)
  },
  set () {
    toggleFilteredInSpace()
  }
})
const toggleFilteredInSpace = () => {
  const filtered = store.state.filteredBoxIds
  const boxId = currentBox.value.id
  if (filtered.includes(boxId)) {
    store.commit('removeFromFilteredBoxId', boxId)
  } else {
    store.commit('addToFilteredBoxId', boxId)
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
