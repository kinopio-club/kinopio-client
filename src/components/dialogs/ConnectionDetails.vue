<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import ResultsFilter from '@/components/ResultsFilter.vue'
import ConnectionActions from '@/components/subsections/ConnectionActions.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import ItemDetailsDebug from '@/components/ItemDetailsDebug.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'

import last from 'lodash-es/last'
import randomColor from 'randomcolor'

const globalStore = useGlobalStore()
const connectionStore = useConnectionStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const dialogElement = ref(null)
const nameElement = ref(null)
const infoSectionElement = ref(null)
const resultsActionsElement = ref(null)

onMounted(() => {
  updatePinchCounterZoomDecimal()
})

const state = reactive({
  colorPickerIsVisible: false,
  resultsSectionMaxHeight: undefined // number

})

// dialog

const visible = computed(() => Boolean(globalStore.connectionDetailsIsVisibleForConnectionId))
watch(() => visible.value, (value, prevValue) => {
  if (value) {
    updatePinchCounterZoomDecimal()
    state.colorPickerIsVisible = false
    scrollIntoViewAndFocus()
  } else {
    state.resultsSectionMaxHeight = undefined
    const element = nameElement.value
    if (!element) { return }
    element.blur()
    globalStore.shouldHideConnectionOutline = false
  }
})

const isThemeDarkAndColorLight = computed(() => {
  const isThemeDark = userStore.theme === 'dark'
  return isThemeDark && !colorisDark.value
})
const styles = computed(() => {
  const position = globalStore.connectionDetailsPosition
  let zoom
  if (utils.isSignificantlyPinchZoomed()) {
    zoom = pinchCounterZoomDecimal.value
  } else {
    zoom = spaceCounterZoomDecimal.value
  }
  return {
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: `scale(${zoom})`
  }
})
const updateResultsSectionMaxHeight = () => {
  const pinchZoom = utils.visualViewport().scale
  const position = globalStore.connectionDetailsPosition
  if (!infoSectionElement.value) { return }
  const infoSection = infoSectionElement.value.getBoundingClientRect()
  const resultsActions = resultsActionsElement.value?.getBoundingClientRect()
  const dialogInfoHeight = infoSection.height + (resultsActions?.height || 0)
  const maxHeight = (globalStore.viewportHeight - position.y - dialogInfoHeight) * pinchZoom
  const minHeight = 300
  let height = Math.max(minHeight, maxHeight)
  height = Math.round(height)
  state.resultsSectionMaxHeight = `calc(90vh - ${height}px)`
}
const scrollIntoView = async () => {
  await nextTick()
  const element = dialogElement.value
  updateResultsSectionMaxHeight()
  await nextTick()
  globalStore.scrollElementIntoView({ element })
}
const scrollIntoViewAndFocus = async () => {
  await scrollIntoView()
  if (utils.isMobile()) { return }
  const element = nameElement.value
  const length = name.value.length
  await nextTick()
  focusName()
  if (length && element) {
    element.setSelectionRange(length, length)
  }
}
const focus = () => {
  globalStore.pinchCounterZoomDecimal = 1
}
const updatePinchCounterZoomDecimal = () => {
  globalStore.pinchCounterZoomDecimal = utils.pinchCounterZoomDecimal()
}
const blur = () => {
  globalStore.triggerUpdateHeaderAndFooterPosition()
}
const closeAllDialogs = () => {
  globalStore.closeAllDialogs()
}

// space

const canEditSpace = computed(() => userStore.getUserCanEditSpace)
const spacePrivacyIsClosed = computed(() => spaceStore.privacy === 'closed')
const spaceCounterZoomDecimal = computed(() => globalStore.getSpaceCounterZoomDecimal)
const pinchCounterZoomDecimal = computed(() => globalStore.pinchCounterZoomDecimal)

// current connection

const currentConnection = computed(() => {
  const id = globalStore.connectionDetailsIsVisibleForConnectionId
  return connectionStore.getConnection(id)
})
const canEditConnection = computed(() => {
  const isSpaceMember = userStore.getUserIsSpaceMember
  const connectionIsCreatedByCurrentUser = userStore.getItemIsCreatedByUser(currentConnection.value)
  const canEditSpace = userStore.getUserCanEditSpace
  if (isSpaceMember) { return true }
  if (canEditSpace && connectionIsCreatedByCurrentUser) { return true }
  return false
})
const colorisDark = computed(() => {
  return utils.colorIsDark(currentConnection.value.color)
})
const removeConnection = () => {
  connectionStore.removeConnection(currentConnection.value.id)
  globalStore.closeAllDialogs()
}
const changeConnectionColor = (color) => {
  connectionStore.updateConnection({
    id: currentConnection.value.id,
    color
  })
}

// filters
const isFilteredInSpace = computed(() => false)
// const isFilteredInSpace = computed({
//   get () {
//     // const types = globalStore.filteredConnectionTypeIds
//     // return types.includes(currentConnectionType.value.id)
//   },
//   set () {
//     // toggleFilteredInSpace()
//   }
// })
const toggleFilteredInSpace = () => {
  // const filtered = globalStore.filteredConnectionTypeIds
  // const typeId = currentConnectionType.value.id
  // if (filtered.includes(typeId)) {
  //   globalStore.removeFromFilteredConnectionTypeId(typeId)
  // } else {
  //   globalStore.addToFilteredConnectionTypeId(typeId)
  // }
}

// use last color

const lastColor = computed(() => {
  return connectionStore.getConnectionColors[0]
})
const shouldUseLastConnectionColor = computed(() => userStore.shouldUseLastConnectionColor)
const toggleShouldUseLastConnectionColor = () => {
  const value = !shouldUseLastConnectionColor.value
  userStore.updateUser({ shouldUseLastConnectionColor: value })
}

// color

const userColor = computed(() => userStore.color)
const color = computed(() => currentConnection.value.color)
const toggleColorPicker = () => {
  console.log('🍒', recentColors.value)
  state.colorPickerIsVisible = !state.colorPickerIsVisible
}
const recentColors = computed(() => connectionStore.getConnectionColors)
const closeColorPicker = () => {
  console.log('🦚🦚')
  state.colorPickerIsVisible = false
  globalStore.triggerCloseChildDialogs()
}
const updateColor = (newColor) => {
  const update = {
    id: currentConnection.value.id,
    color: newColor
  }
  connectionStore.updateConnection(update)
}

// name

const name = computed({
  get () {
    return currentConnection.value.name
  },
  set (newName) {
    const update = {
      id: currentConnection.value.id,
      name: newName,
      updatedAt: new Date()
    }
    connectionStore.updateConnection(update)
  }
})
const focusName = async () => {
  await nextTick()
  const element = nameElement.value
  if (!element) { return }
  element.focus()
}
</script>

<template lang="pug">
dialog.connection-details.narrow(v-if="visible" :open="visible" :style="styles" @click.left="closeColorPicker" ref="dialogElement")
  section.info-section(:style="{backgroundColor: color}" ref="infoSectionElement")
    .dark-theme-background-layer(v-if="isThemeDarkAndColorLight")
    //- color, name
    .row
      .button-wrap
        button.change-color(:disabled="!canEditConnection" @click.left.stop="toggleColorPicker" :class="{active: state.colorPickerIsVisible}")
          .current-color(:style="{backgroundColor: color}")
        ColorPicker(:currentColor="color" :visible="state.colorPickerIsVisible" @selectedColor="updateColor" :recentColors="recentColors")
      input.connection-name(:disabled="!canEditConnection" placeholder="Connection Name" v-model="name" ref="nameElement" @focus="focus" @blur="blur" :class="{'is-dark': colorisDark}" @keyup.enter.prevent="closeAllDialogs")
    .row(v-if="canEditConnection")
      //- Remove
      button.danger(@click.left="removeConnection")
        img.icon(src="@/assets/remove.svg")

    //- label, reverse etc.
    template(v-if="canEditConnection")
      ConnectionActions(:hideType="true" :visible="canEditConnection" :connections="[currentConnection]" :canEdit="canEditConnection" :backgroundColor="userColor")
    //- read only badge
    .row(v-if="!canEditConnection")
      .badge.info
        img.icon(src="@/assets/unlock.svg")
        span Read Only

    //- debug
    ItemDetailsDebug(:item="currentConnection" :keys="['startItemId', 'endItemId', 'path']")

  section.results-actions(v-if="canEditConnection" ref="resultsActionsElement")
    //- Use Last color
    .row.title-row
      label(:class="{active: shouldUseLastConnectionColor}" @click.left.prevent="toggleShouldUseLastConnectionColor" @keydown.stop.enter="toggleShouldUseLastConnectionColor")
        input(type="checkbox" v-model="shouldUseLastConnectionColor")
        .badge.badge-in-button(:style="{backgroundColor: lastColor}")
        span Use Last Color
      //- Filter
      button.small-button(@click.left.prevent="toggleFilteredInSpace" @keydown.stop.enter="toggleFilteredInSpace" :class="{active: isFilteredInSpace}")
        img.icon(src="@/assets/filter.svg")
</template>

<style lang="stylus">
.connection-details
  z-index var(--max-z)
  transform-origin top left
  .connection-name
    margin-left 6px
    border-color var(--primary-on-light-background)
    color var(--primary-on-light-background)
    &.is-dark
      border-color var(--primary-on-dark-background)
      color var(--primary-on-dark-background)
  .edit-message
    button
      margin-top 10px
  .results-actions
    .badge-in-button
      margin-left 5px
      padding 7px 7px
      min-height initial
      display inline-block
      min-width initial
      vertical-align middle
    label
      .badge-in-button
        margin-left 0
  .name
    color var(--primary)
  .info-section
    position relative
  .dark-theme-background-layer
    z-index 0

</style>
