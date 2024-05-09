<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import ResultsFilter from '@/components/ResultsFilter.vue'
import ConnectionTypeList from '@/components/ConnectionTypeList.vue'
import ConnectionDecorators from '@/components/ConnectionDecorators.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import utils from '@/utils.js'

import last from 'lodash-es/last'
import sortBy from 'lodash-es/sortBy'
import randomColor from 'randomcolor'
import dayjs from 'dayjs'

const store = useStore()

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

const visible = computed(() => Boolean(store.state.connectionDetailsIsVisibleForConnectionId))
watch(() => visible.value, (value, prevValue) => {
  if (value) {
    updatePinchCounterZoomDecimal()
    updateNextConnectionColor()
  } else {
    store.dispatch('history/resume')
    state.resultsSectionMaxHeight = undefined
    if (state.inputIsFocused) {
      store.dispatch('history/add', { connectionTypes: [prevConnectionType], useSnapshot: true })
      state.inputIsFocused = false
    }
  }
})

const isThemeDarkAndTypeColorLight = computed(() => {
  const isThemeDark = store.state.currentUser.theme === 'dark'
  const typeColorIsLight = !utils.colorIsDark(typeColor.value)
  return isThemeDark && typeColorIsLight
})
const styles = computed(() => {
  const position = store.state.connectionDetailsPosition
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
  const position = store.state.connectionDetailsPosition
  if (!infoSectionElement.value) { return }
  const infoSection = infoSectionElement.value.getBoundingClientRect()
  const resultsActions = resultsActionsElement.value?.getBoundingClientRect()
  const dialogInfoHeight = infoSection.height + (resultsActions?.height || 0)
  const maxHeight = (store.state.viewportHeight - position.y - dialogInfoHeight) * pinchZoom
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
  utils.scrollIntoView({ element })
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
  store.commit('triggerSignUpOrInIsVisible')
}
const focus = () => {
  store.commit('pinchCounterZoomDecimal', 1)
  store.dispatch('history/pause')
  state.inputIsFocused = true
}
const updatePinchCounterZoomDecimal = () => {
  store.commit('pinchCounterZoomDecimal', utils.pinchCounterZoomDecimal())
}
const blur = () => {
  store.commit('triggerUpdateHeaderAndFooterPosition')
  store.dispatch('history/resume')
  const connectionType = utils.clone(currentConnectionType.value)
  store.dispatch('history/add', { connectionTypes: [connectionType], useSnapshot: true })
  state.inputIsFocused = false
}

// space

const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())
const spacePrivacyIsOpen = computed(() => store.state.currentSpace.privacy === 'open')
const spacePrivacyIsClosed = computed(() => store.state.currentSpace.privacy === 'closed')
const isInvitedButCannotEditSpace = computed(() => store.getters['currentUser/isInvitedButCannotEditSpace']())
const spaceCounterZoomDecimal = computed(() => store.getters.spaceCounterZoomDecimal)
const pinchCounterZoomDecimal = computed(() => store.state.pinchCounterZoomDecimal)

// current connection

const currentConnection = computed(() => {
  const id = store.state.connectionDetailsIsVisibleForConnectionId
  return store.getters['currentConnections/byId'](id)
})
watch(() => currentConnection.value, async (value, prevValue) => {
  store.dispatch('currentConnections/removeUnusedTypes')
  await nextTick()
  if (visible.value) {
    state.colorPickerIsVisible = false
    scrollIntoViewAndFocus()
    store.commit('currentConnections/lastTypeId', currentConnectionType.value.id)
  } else {
    store.commit('shouldHideConnectionOutline', false)
  }
})
const currentConnectionType = computed(() => {
  const connectionType = store.getters['currentConnections/typeByConnection'](currentConnection.value)
  prevConnectionType = connectionType
  return connectionType
})

// type

const connectionTypes = computed(() => store.getters['currentConnections/allTypes'])
const connectionTypesByUpdatedAt = computed(() => {
  let types = connectionTypes.value
  types = sortBy(types, type => dayjs(type.updatedAt).valueOf())
  types.reverse()
  return types
})
const canEditConnection = computed(() => {
  const isSpaceMember = store.getters['currentUser/isSpaceMember']()
  const connectionIsCreatedByCurrentUser = store.getters['currentUser/connectionIsCreatedByCurrentUser'](currentConnection.value)
  const canEditSpace = store.getters['currentUser/canEditSpace']()
  if (isSpaceMember) { return true }
  if (canEditSpace && connectionIsCreatedByCurrentUser) { return true }
  return false
})
const typeColorisDark = computed(() => {
  return utils.colorIsDark(typeColor.value)
})
const addConnectionType = () => {
  store.dispatch('currentConnections/addType', { color: state.nextConnectionTypeColor })
  const types = utils.clone(connectionTypes.value)
  const newType = last(types)
  changeConnectionType(newType)
  updateNextConnectionColor()
}
const removeConnection = () => {
  store.dispatch('currentConnections/remove', currentConnection.value)
  store.dispatch('closeAllDialogs')
  store.dispatch('currentConnections/removeUnusedTypes')
}
const changeConnectionType = (type) => {
  store.dispatch('currentConnections/update', {
    id: currentConnection.value.id,
    connectionTypeId: type.id
  })
  store.commit('currentConnections/lastTypeId', type.id)
}

// filters

const isFilteredInSpace = computed({
  get () {
    const types = store.state.filteredConnectionTypeIds
    return types.includes(currentConnectionType.value.id)
  },
  set () {
    toggleFilteredInSpace()
  }
})
const toggleFilteredInSpace = () => {
  const filtered = store.state.filteredConnectionTypeIds
  const typeId = currentConnectionType.value.id
  if (filtered.includes(typeId)) {
    store.commit('removeFromFilteredConnectionTypeId', typeId)
  } else {
    store.commit('addToFilteredConnectionTypeId', typeId)
  }
}

// use last type

const lastTypeColor = computed(() => {
  const lastType = store.getters['currentConnections/lastType']
  return lastType?.color
})
const shouldUseLastConnectionType = computed(() => store.state.currentUser.shouldUseLastConnectionType)
const toggleShouldUseLastConnectionType = () => {
  const value = !shouldUseLastConnectionType.value
  store.dispatch('currentUser/shouldUseLastConnectionType', value)
}

// color

const typeColor = computed(() => currentConnectionType.value.color)
const toggleColorPicker = () => {
  state.colorPickerIsVisible = !state.colorPickerIsVisible
}
const closeColorPicker = () => {
  state.colorPickerIsVisible = false
  store.commit('triggerCloseChildDialogs')
}
const updateTypeColor = (newColor) => {
  const connectionType = {
    id: currentConnectionType.value.id,
    color: newColor
  }
  store.dispatch('currentConnections/updateType', connectionType)
}
const updateNextConnectionColor = () => {
  const isThemeDark = store.state.currentUser.theme === 'dark'
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
    const connectionType = {
      id: currentConnectionType.value.id,
      name: newName,
      updatedAt: new Date()
    }
    store.dispatch('currentConnections/updateType', connectionType)
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
    .row
      .button-wrap
        button.change-color(:disabled="!canEditConnection" @click.left.stop="toggleColorPicker" :class="{active: state.colorPickerIsVisible}")
          .current-color(:style="{backgroundColor: typeColor}")
        ColorPicker(:currentColor="typeColor" :visible="state.colorPickerIsVisible" @selectedColor="updateTypeColor")
      input.type-name(:disabled="!canEditConnection" placeholder="Connection Name" v-model="typeName" ref="typeNameElement" @focus="focus" @blur="blur" :class="{'is-dark': typeColorisDark}")
    .row(v-if="canEditConnection")
      //- Arrows or Label
      ConnectionDecorators(:connections="[currentConnection]")
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
    .row(v-if="canEditConnection")
      //- Remove
      button.danger(@click.left="removeConnection")
        img.icon(src="@/assets/remove.svg")
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
