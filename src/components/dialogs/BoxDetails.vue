<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import CardOrBoxActions from '@/components/subsections/CardOrBoxActions.vue'
import utils from '@/utils.js'
const store = useStore()

const dialogElement = ref(null)
const nameElement = ref(null)

let prevBoxId

const state = reactive({
  colorPickerIsVisible: false,
  isUpdated: false
})

const visible = computed(() => utils.objectHasKeys(currentBox.value))
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
    store.dispatch('currentBoxes/updateInfoDimensions', {})
    if (!box) { return }
    store.dispatch('history/add', { boxes: [box], useSnapshot: true })
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
  let box = { id: currentBox.value.id }
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
  const styles = {
    transform: `scale(${zoom})`,
    left: `${currentBox.value.x + 8}px`,
    top: `${currentBox.value.y + 8}px`,
    backgroundColor: currentBox.value.color
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
  let start = length
  if (currentBoxIsNew) {
    start = 0
  }
  if (length && element) {
    element.setSelectionRange(start, length)
  }
  store.commit('currentBoxIsNew', false)
}
const textareaSizes = () => {
  const element = dialogElement.value
  let textarea = element.querySelector('textarea')
  let modifier = 0
  if (canEditBox.value) {
    modifier = 1
  }
  textarea.style.height = textarea.scrollHeight + modifier + 'px'
}

// colors

const itemColors = computed(() => store.getters['currentSpace/itemColors'])
const colorisDark = computed(() => {
  const color = currentBox.value.color
  return utils.colorIsDark(color)
})
const toggleColorPicker = () => {
  state.colorPickerIsVisible = !state.colorPickerIsVisible
}
const updateColor = (color) => {
  update({ color })
}

// remove

const removeBox = () => {
  store.dispatch('history/resume')
  store.dispatch('currentBoxes/remove', currentBox.value)
}

// dialog state

const closeDialogs = () => {
  state.colorPickerIsVisible = false
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
</script>

<template lang="pug">
dialog.narrow.box-details(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialogElement" :style="styles" :data-box-id="currentBox.id")
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
          :class="{'is-dark': colorisDark}"
        )
    CardOrBoxActions(:visible="canEditBox" :boxes="[currentBox]" @closeDialogs="closeDialogs" :colorIsHidden="true")
    .row(v-if="canEditBox")
      //- remove
      .button-wrap
        button.danger(@click.left="removeBox")
          img.icon(src="@/assets/remove.svg")
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
    &.is-dark
      color var(--primary-background)
  .info-row
    align-items flex-start
</style>
