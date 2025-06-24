<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useHistoryStore } from '@/stores/useHistoryStore'

import ResultsFilter from '@/components/ResultsFilter.vue'
import ConnectionTypeList from '@/components/ConnectionTypeList.vue'
import ConnectionActions from '@/components/subsections/ConnectionActions.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import ItemDetailsDebug from '@/components/ItemDetailsDebug.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'

import last from 'lodash-es/last'
import sortBy from 'lodash-es/sortBy'
import randomColor from 'randomcolor'
import dayjs from 'dayjs'

const globalStore = useGlobalStore()
const connectionStore = useConnectionStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const historyStore = useHistoryStore()

let prevConnectionType
const dialogElement = ref(null)
const typeNameElement = ref(null)
const infoSectionElement = ref(null)
const resultsActionsElement = ref(null)

onMounted(() => {
  updatePinchCounterZoomDecimal()
})

const state = reactive({
  colorPickerIsVisible: false,
  resultsSectionMaxHeight: undefined, // number
  nextConnectionTypeColor: '',
  inputIsFocused: false
})

// dialog

const visible = computed(() => Boolean(globalStore.connectionDetailsIsVisibleForConnectionId))
const isDevelopment = computed(() => consts.isDevelopment())
watch(() => visible.value, (value, prevValue) => {
  if (value) {
    updatePinchCounterZoomDecimal()
    updateNextConnectionColor()
  } else {
    state.resultsSectionMaxHeight = undefined
    if (state.inputIsFocused) {
      state.inputIsFocused = false
    }
  }
})

const isThemeDarkAndTypeColorLight = computed(() => {
  const isThemeDark = userStore.theme === 'dark'
  const typeColorIsLight = !utils.colorIsDark(typeColor.value)
  return isThemeDark && typeColorIsLight
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
  scrollIntoView()
  if (utils.isMobile()) { return }
  const element = typeNameElement.value
  const length = typeName.value.length
  await nextTick()
  focusName()
  if (length && element) {
    element.setSelectionRange(length, length)
  }
}
const triggerSignUpOrInIsVisible = () => {
  globalStore.triggerSignUpOrInIsVisible()
}
const focus = () => {
  globalStore.pinchCounterZoomDecimal = 1
  state.inputIsFocused = true
}
const updatePinchCounterZoomDecimal = () => {
  globalStore.pinchCounterZoomDecimal = utils.pinchCounterZoomDecimal()
}
const blur = () => {
  globalStore.triggerUpdateHeaderAndFooterPosition()
  const connectionType = utils.clone(currentConnectionType.value)
  state.inputIsFocused = false
}
const closeAllDialogs = () => {
  globalStore.closeAllDialogs()
}

// space

const canEditSpace = computed(() => userStore.getUserCanEditSpace)
const spacePrivacyIsOpen = computed(() => spaceStore.privacy === 'open')
const spacePrivacyIsClosed = computed(() => spaceStore.privacy === 'closed')
const isInvitedButCannotEditSpace = computed(() => globalStore.currentUserIsInvitedButCannotEditCurrentSpace)
const spaceCounterZoomDecimal = computed(() => globalStore.getSpaceCounterZoomDecimal)
const pinchCounterZoomDecimal = computed(() => globalStore.pinchCounterZoomDecimal)

// current connection

const currentConnection = computed(() => {
  const id = globalStore.connectionDetailsIsVisibleForConnectionId
  return connectionStore.getConnection(id)
})
watch(() => currentConnection.value, async (value, prevValue) => {
  connectionStore.removeAllUnusedConnectionTypes()
  await nextTick()
  if (visible.value) {
    state.colorPickerIsVisible = false
    scrollIntoViewAndFocus()
    connectionStore.updatePrevConnectionTypeId(currentConnectionType.value.id)
  } else {
    globalStore.shouldHideConnectionOutline = false
  }
})
const currentConnectionType = computed(() => {
  const connectionType = connectionStore.getConnectionTypeByConnectionId(currentConnection.value.id)
  prevConnectionType = connectionType
  return connectionType
})

// type

const connectionTypes = computed(() => connectionStore.getAllConnectionTypes)
const connectionTypesByUpdatedAt = computed(() => {
  let types = connectionTypes.value
  types = sortBy(types, type => dayjs(type.updatedAt).valueOf())
  types.reverse()
  return types
})
const canEditConnection = computed(() => {
  const isSpaceMember = userStore.getUserIsSpaceMember
  const connectionIsCreatedByCurrentUser = userStore.getItemIsCreatedByUser(currentConnection.value)
  const canEditSpace = userStore.getUserCanEditSpace
  if (isSpaceMember) { return true }
  if (canEditSpace && connectionIsCreatedByCurrentUser) { return true }
  return false
})
const typeColorisDark = computed(() => {
  return utils.colorIsDark(typeColor.value)
})
const addConnectionType = () => {
  connectionStore.createConnectionType({ color: state.nextConnectionTypeColor })
  const types = utils.clone(connectionTypes.value)
  const newType = last(types)
  changeConnectionType(newType)
  updateNextConnectionColor()
}
const removeConnection = () => {
  connectionStore.removeConnection(currentConnection.value.id)
  globalStore.closeAllDialogs()
  connectionStore.removeAllUnusedConnectionTypes()
}
const changeConnectionType = (type) => {
  connectionStore.updateConnection({
    id: currentConnection.value.id,
    connectionTypeId: type.id
  })
  connectionStore.updatePrevConnectionTypeId(type.id)
}

// filters

const isFilteredInSpace = computed({
  get () {
    const types = globalStore.filteredConnectionTypeIds
    return types.includes(currentConnectionType.value.id)
  },
  set () {
    toggleFilteredInSpace()
  }
})
const toggleFilteredInSpace = () => {
  const filtered = globalStore.filteredConnectionTypeIds
  const typeId = currentConnectionType.value.id
  if (filtered.includes(typeId)) {
    globalStore.removeFromFilteredConnectionTypeId(typeId)
  } else {
    globalStore.addToFilteredConnectionTypeId(typeId)
  }
}

// use last type

const lastTypeColor = computed(() => {
  const lastType = connectionStore.prevConnectionTypeId
  return lastType?.color
})
const shouldUseLastConnectionType = computed(() => userStore.shouldUseLastConnectionType)
const toggleShouldUseLastConnectionType = () => {
  const value = !shouldUseLastConnectionType.value
  userStore.updateUser({ shouldUseLastConnectionType: value })
}

// color

const userColor = computed(() => userStore.color)
const typeColor = computed(() => currentConnectionType.value.color)
const toggleColorPicker = () => {
  state.colorPickerIsVisible = !state.colorPickerIsVisible
}
const closeColorPicker = () => {
  state.colorPickerIsVisible = false
  globalStore.triggerCloseChildDialogs()
}
const updateTypeColor = (newColor) => {
  const update = {
    id: currentConnectionType.value.id,
    color: newColor
  }
  connectionStore.updateConnectionType(update)
}
const updateNextConnectionColor = () => {
  const isThemeDark = userStore.theme === 'dark'
  let color = randomColor({ luminosity: 'light' })
  if (isThemeDark) {
    color = randomColor({ luminosity: 'dark' })
  }
  state.nextConnectionTypeColor = color
}

// name

const typeName = computed({
  get () {
    return currentConnectionType.value.name
  },
  set (newName) {
    const update = {
      id: currentConnectionType.value.id,
      name: newName,
      updatedAt: new Date()
    }
    connectionStore.updateConnectionType(update)
  }
})
const focusName = async () => {
  await nextTick()
  const element = typeNameElement.value
  if (!element) { return }
  element.focus()
  state.inputIsFocused = true
}
</script>

<template lang="pug">
dialog.connection-details.narrow(v-if="visible" :open="visible" :style="styles" @click.left="closeColorPicker" ref="dialogElement")
  section.info-section(:style="{backgroundColor: typeColor}" ref="infoSectionElement")
    .dark-theme-background-layer(v-if="isThemeDarkAndTypeColorLight")
    //- color, name
    .row
      .button-wrap
        button.change-color(:disabled="!canEditConnection" @click.left.stop="toggleColorPicker" :class="{active: state.colorPickerIsVisible}")
          .current-color(:style="{backgroundColor: typeColor}")
        ColorPicker(:currentColor="typeColor" :visible="state.colorPickerIsVisible" @selectedColor="updateTypeColor")
      input.type-name(:disabled="!canEditConnection" placeholder="Connection Name" v-model="typeName" ref="typeNameElement" @focus="focus" @blur="blur" :class="{'is-dark': typeColorisDark}" @keyup.enter.prevent="closeAllDialogs")
    .row(v-if="canEditConnection")
      //- Remove
      button.danger(@click.left="removeConnection")
        img.icon(src="@/assets/remove.svg")

    //- debug
    ItemDetailsDebug(:item="currentConnection" :keys="['startItemId', 'endItemId', 'path']")

    //- h1, h2, label etc.
    ConnectionActions(:hideType="true" :visible="canEditConnection" :connections="[currentConnection]" :canEdit="canEditConnection" :backgroundColor="userColor")

    p.edit-message.badge.info(v-if="!canEditConnection")
      template(v-if="spacePrivacyIsOpen")
        img.icon.open(src="@/assets/open.svg")
        span In open spaces, you can only edit connections you created
      template(v-else-if="isInvitedButCannotEditSpace")
        img.icon(src="@/assets/unlock.svg")
        span To edit spaces you've been invited to, you'll need to sign up or in
        .row
          .button-wrap
            button(@click.left.stop="triggerSignUpOrInIsVisible") Sign Up or In
      template(v-else-if="spacePrivacyIsClosed")
        img.icon(src="@/assets/unlock.svg")
        span Read Only
  section.results-actions(v-if="canEditConnection" ref="resultsActionsElement")
    //- Use Last Type
    .row.title-row
      label(:class="{active: shouldUseLastConnectionType}" @click.left.prevent="toggleShouldUseLastConnectionType" @keydown.stop.enter="toggleShouldUseLastConnectionType")
        input(type="checkbox" v-model="shouldUseLastConnectionType")
        .badge.badge-in-button(:style="{backgroundColor: lastTypeColor}")
        span Use Last Type
      //- Filter
      button.small-button(@click.left.prevent="toggleFilteredInSpace" @keydown.stop.enter="toggleFilteredInSpace" :class="{active: isFilteredInSpace}")
        img.icon(src="@/assets/filter.svg")
    .row
      button(@click.left="addConnectionType")
        img.icon(src="@/assets/add.svg")
        .badge.badge-in-button(:style="{backgroundColor: state.nextConnectionTypeColor}")
        span Type
  section.results-section(ref="resultsSectionElement" :style="{'max-height': state.resultsSectionMaxHeight}")
    ConnectionTypeList(:connections="[currentConnection]" :connectionTypes="connectionTypesByUpdatedAt" @select="changeConnectionType" :canEditConnection="canEditConnection" @updateTypeColor="updateTypeColor" :resultsFilterIsVisible="canEditConnection")
</template>

<style lang="stylus">
.connection-details
  z-index var(--max-z)
  transform-origin top left
  .type-name
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
      border-radius var(--small-entity-radius)
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
