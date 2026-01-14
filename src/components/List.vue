<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useListStore } from '@/stores/useListStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'

import utils from '@/utils.js'

// import { colord, extend } from 'colord'

const globalStore = useGlobalStore()
const listStore = useListStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const broadcastStore = useBroadcastStore()

// let unsubscribes

const borderWidth = 2
// locking
// long press to touch drag
const lockingPreDuration = 100 // ms
const lockingDuration = 100 // ms
let lockingAnimationTimer, lockingStartTime, shouldCancelLocking
let isMultiTouch
let initialTouchEvent = {}
let touchPosition = {}
let currentTouchPosition = {}

// onMounted(() => {
//   console.info('🐴 the component is now mounted.', spaceStore.getSpaceAllState)
//   const globalActionUnsubscribe = globalStore.$onAction(
//     ({ name, args }) => {
//       if (name === 'clearDraggingItems') {
//         console.log('clearDraggingItems')
//       }
//     }
//   )
//   unsubscribes = () => {
//     globalActionUnsubscribe()
//   }
// })
// onBeforeUnmount(() => {
//   unsubscribes()
// })

const props = defineProps({
  list: Object
})
const state = reactive({
  isHover: false,
  isLocking: false,
  lockingPercent: 0,
  lockingAlpha: 0
  // isVisibleInViewport: false,
  // shouldRenderParent: false,
})

const canEditSpace = computed(() => userStore.getUserCanEditSpace)
const userColor = computed(() => userStore.color)

// cards

const listCards = computed(() => {
  let cards = cardStore.getAllCards
  cards = cards.filter(card => card.listId === props.list.id)
  return cards
})

// interacting

const isPaintSelecting = computed(() => globalStore.currentUserIsPaintSelecting)
const currentListIsBeingDragged = computed(() => {
  const isDragging = globalStore.currentUserIsDraggingList
  const isCurrent = globalStore.currentDraggingListId === props.list.id
  return isDragging && (isCurrent || currentListIsSelected.value)
})
const isResizing = computed(() => {
  const isResizing = globalStore.currentUserIsResizingList
  const isCurrent = globalStore.currentUserIsResizingListIds.includes(props.list.id)
  return isResizing && isCurrent
})
const currentListIsSelected = computed(() => {
  const selected = globalStore.multipleListsSelectedIds
  return selected.find(id => props.list.id === id)
})
const updateIsHover = (value) => {
  if (globalStore.currentUserIsDraggingList) { return }
  if (isPaintSelecting.value) { return }
  state.isHover = value
}
const startListInfoInteraction = async (event) => {
  if (!currentListIsSelected.value) {
    globalStore.clearMultipleSelected()
  }
  if (!canEditSpace.value) { return }
  globalStore.currentDraggingListId = ''
  globalStore.closeAllDialogs()
  globalStore.currentUserIsDraggingList = true
  const list = props.list.id
  // if (event.altKey) {
  //   list = await startDraggingDuplicateItems(event)
  // }
  globalStore.currentDraggingListId = list
  // listStore.incrementListZ(list)
}
const endListInfoInteraction = (event) => {
  // const isMeta = event.metaKey || event.ctrlKey
  const userId = userStore.id
  if (globalStore.currentUserIsPaintSelecting) { return }
  if (isMultiTouch) { return }
  if (globalStore.currentUserIsPanningReady || globalStore.currentUserIsPanning) { return }
  if (!canEditSpace.value) { globalStore.triggerReadOnlyJiggle() }
  broadcastStore.update({ updates: { userId }, action: 'clearRemoteListsDragging' })
  globalStore.closeAllDialogs()
  // if (isMeta) {
  //   globalStore.updateMultipleListsSelectedIds([props.list.id])
  //   listStore.selectItemsInSelectedLists()
  //   globalStore.updateMultipleListsSelectedIds([])
  //   globalStore.currentUserIsDraggingList = false
  //   globalStore.shouldCancelNextMouseUpInteraction = true
  // } else {
  globalStore.clearMultipleSelected()
  // }
  if (globalStore.preventDraggedListFromShowingDetails) { return }
  // if (isMeta) { return }
  globalStore.updateListDetailsIsVisibleForListId(props.list.id)
  event.stopPropagation() // prevent stopInteractions() from closing listDetails
  globalStore.currentUserIsDraggingList = false
  globalStore.listsWereDragged = false
}

// Remote

const isRemoteSelected = computed(() => {
  const remoteListsSelected = globalStore.remoteListsSelected
  const selectedList = remoteListsSelected.find(list => list.listId === props.list.id)
  return Boolean(selectedList)
})
const isRemoteListDetailsVisible = computed(() => {
  const remoteListDetailsVisible = globalStore.remoteListDetailsVisible
  const visibleList = remoteListDetailsVisible.find(list => list.listId === props.list.id)
  return Boolean(visibleList)
})
const remoteListDetailsVisibleColor = computed(() => {
  const remoteListDetailsVisible = globalStore.remoteListDetailsVisible
  const visibleList = remoteListDetailsVisible.find(list => list.listId === props.list.id)
  if (visibleList) {
    const user = spaceStore.getSpaceUserById(visibleList.userId)
    return user.color
  } else {
    return undefined
  }
})
const remoteSelectedColor = computed(() => {
  const remoteListsSelected = globalStore.remoteListsSelected
  const selectedList = remoteListsSelected.find(list => list.listId === props.list.id)
  if (selectedList) {
    const user = spaceStore.getSpaceUserById(selectedList.userId)
    return user.color
  } else {
    return undefined
  }
})
const remoteUserResizingListsColor = computed(() => {
  const remoteUserResizingLists = globalStore.remoteUserResizingLists
  if (!remoteUserResizingLists.length) { return }
  let user = remoteUserResizingLists.find(user => user.listIds.includes(props.list.id))
  if (user) {
    user = spaceStore.getSpaceUserById(user.userId)
    return user.color
  } else {
    return undefined
  }
})
const remoteListDraggingColor = computed(() => {
  const remoteListsDragging = globalStore.remoteListsDragging
  const draggingList = remoteListsDragging.find(list => list.listId === props.list.id)
  if (draggingList) {
    const user = spaceStore.getSpaceUserById(draggingList.userId)
    return user.color
  } else {
    return undefined
  }
})

// touch locking

const lockingFrameStyle = computed(() => {
  const initialPadding = 65 // matches initialLockCircleRadius in paintSelect
  const initialBorderRadius = 50
  const padding = initialPadding * state.lockingPercent
  const borderRadius = Math.max((state.lockingPercent * initialBorderRadius), 5) + 'px'
  const size = `calc(100% + ${padding}px)`
  const position = -(padding / 2) + 'px'
  return {
    width: size,
    height: size,
    left: position,
    top: position,
    background: userColor.value,
    opacity: state.lockingAlpha,
    borderRadius
  }
})
const cancelLocking = () => {
  shouldCancelLocking = true
}
const cancelLockingAnimationFrame = () => {
  state.isLocking = false
  state.lockingPercent = 0
  state.lockingAlpha = 0
  shouldCancelLocking = false
}
const startLocking = (event) => {
  console.info('startLocking', event)
  updateTouchPosition(event)
  updateCurrentTouchPosition(event)
  state.isLocking = true
  shouldCancelLocking = false
  setTimeout(() => {
    if (!lockingAnimationTimer) {
      lockingAnimationTimer = window.requestAnimationFrame(lockingAnimationFrame)
    }
  }, lockingPreDuration)
}
const lockingAnimationFrame = (timestamp) => {
  if (!lockingStartTime) {
    lockingStartTime = timestamp
  }
  const elaspedTime = timestamp - lockingStartTime
  const percentComplete = (elaspedTime / lockingDuration) // between 0 and 1
  if (!utils.cursorsAreClose(touchPosition, currentTouchPosition)) {
    notifyPressAndHoldToDrag()
    cancelLockingAnimationFrame()
  }
  if (shouldCancelLocking) {
    cancelLockingAnimationFrame()
  }
  if (state.isLocking && percentComplete <= 1) {
    const percentRemaining = Math.abs(percentComplete - 1)
    state.lockingPercent = percentRemaining
    const alpha = utils.easeOut(percentComplete, elaspedTime, lockingDuration)
    state.lockingAlpha = alpha
    window.requestAnimationFrame(lockingAnimationFrame)
  } else if (state.isLocking && percentComplete > 1) {
    console.info('🔒🐢 box lockingAnimationFrame locked')
    lockingAnimationTimer = undefined
    lockingStartTime = undefined
    state.isLocking = false
    startListInfoInteraction(initialTouchEvent)
  } else {
    window.cancelAnimationFrame(lockingAnimationTimer)
    lockingAnimationTimer = undefined
    lockingStartTime = undefined
    cancelLockingAnimationFrame()
  }
}
const notifyPressAndHoldToDrag = () => {
  const hasNotified = globalStore.hasNotifiedPressAndHoldToDrag
  if (!hasNotified) {
    globalStore.addNotification({ message: 'Press and hold to drag', icon: 'press-and-hold' })
  }
  globalStore.hasNotifiedPressAndHoldToDrag = true
}
const updateTouchPosition = (event) => {
  initialTouchEvent = event
  isMultiTouch = false
  if (utils.isMultiTouch(event)) {
    isMultiTouch = true
    return
  }
  touchPosition = utils.cursorPositionInViewport(event)
}
const updateCurrentTouchPosition = (event) => {
  currentTouchPosition = utils.cursorPositionInViewport(event)
  if (currentListIsBeingDragged.value || isResizing.value) {
    event.preventDefault() // allows dragging boxes without scrolling
  }
}
const touchIsNearTouchPosition = (event) => {
  const currentPosition = utils.cursorPositionInViewport(event)
  const touchBlur = 12
  const isTouchX = utils.isBetween({
    value: currentPosition.x,
    min: touchPosition.x - touchBlur,
    max: touchPosition.x + touchBlur
  })
  const isTouchY = utils.isBetween({
    value: currentPosition.y,
    min: touchPosition.y - touchBlur,
    max: touchPosition.y + touchBlur
  })
  if (isTouchX && isTouchY) {
    return true
  }
}
const endListInfoInteractionTouch = (event) => {
  cancelLocking()
  if (touchIsNearTouchPosition(event)) {
    endListInfoInteraction(event)
  }
}

// styles

const color = computed(() => {
  const remoteColor = (
    remoteListDetailsVisibleColor.value ||
    remoteSelectedColor.value ||
    remoteUserResizingListsColor.value ||
    remoteListDraggingColor.value
  )
  if (remoteColor) {
    return remoteColor
  } else if (currentListIsSelected.value) {
    return userColor.value
  } else {
    return props.list.color
  }
})
const colorIsDark = computed(() => {
  const color = props.list.color
  return utils.colorIsDark(color)
})
// const fillColor = computed(() => {
//   let value = color.value
//   value = colord(value).alpha(0.5).toRgbString()
//   return value
// })
const listStyles = computed(() => {
  const { x, y, z } = props.list
  const width = props.list.resizeWidth || props.list.width
  const styles = {
    left: x + 'px',
    top: y + 'px',
    zIndex: z || 1,
    width: width + 'px',

    // todo move to box bk
    // ?border: `${borderWidth}px solid ${color.value}`,
    backgroundColor: color.value
  }
  console.log('💐💐💐💐', styles, props.list)
  return styles
})
// const infoStyles = computed(() => {
//   const { x, y, resizeWidth } = normalizedList.value
//   // x, y
//   const styles = {
//     left: x + 'px',
//     top: y + 'px',
//     maxWidth: resizeWidth + 'px',
//     backgroundColor: color.value
//   }
//   if (isLocked.value) {
//     styles.pointerEvents = 'none'
//   }
//   return styles
// })
const classes = computed(() => {
  return {
    hover: state.isHover,
    active: currentListIsBeingDragged.value,
    'is-resizing': isResizing.value,
    'is-selected': currentListIsSelected.value
    // filtered: isFiltered.value,
    // transition: !globalStore.currentListIsNew || !globalStore.currentUserIsResizingList
  }
})
const infoClasses = computed(() => {
  const classes = utils.colorClasses({ backgroundColor: props.list.color })
  if (state.isHover) {
    classes.push('hover')
  }
  return classes
})
const buttonClasses = computed(() => {
  const classes = []
  if (colorIsDark.value) {
    classes.push('is-dark')
  } else {
    classes.push('is-light')
  }
  // if ()
  console.log(classes)
  return classes
// :class="{'is-light': isLightInDarkTheme, 'is-dark': isDarkInLightTheme}")
})
</script>

<template lang="pug">
.list(
  :key="list.id"
  :data-list-id="list.id"
  :data-x="list.x"
  :data-y="list.y"
  :style="listStyles"
  :class="classes"
  ref="listElement"
)
  //- teleport(to="#list-backgrounds")
    //- .list-background

  //- teleport(to="#list-infos")
  .list-info(
    :data-list-id="list.id"
    :class="infoClasses"
    tabindex="0"

    @mouseover="updateIsHover(true)"
    @mouseleave="updateIsHover(false)"
    @mousedown.left="startListInfoInteraction"

    @mouseup.left="endListInfoInteraction"
    @keyup.stop.enter="endListInfoInteraction"

    @touchstart="startLocking"
    @touchmove="updateCurrentTouchPosition"
    @touchend="endListInfoInteractionTouch"
  )
    .locking-frame(v-if="state.isLocking" :style="lockingFrameStyle")
    .row
      //- collapse/expand
      .inline-button-wrap
        button.small-button.inline-button(title="Collapse/Expand")
          img.icon.left-arrow(src="@/assets/right-arrow.svg")
          span {{ listCards.length }}
      //- add card
      .inline-button-wrap
        button.small-button.inline-button(title="Add Card")
          img.icon.add(src="@/assets/add.svg")
      span.name {{ props.list.name }}

  //- resize
  //- .bottom-button-wrap(v-if="resizeIsVisible" :class="{unselectable: isPaintSelecting}")
  //-   .inline-button-wrap(
  //-       @pointerover="updateIsHover(true)"
  //-       @pointerleave="updateIsHover(false)"
  //-       @mousedown.left="startResizing"
  //-       @touchstart="startResizing"
  //-       @dblclick="shrink"
  //-     )
  //-     button.inline-button(
  //-       tabindex="-1"
  //-     )
  //-       img.resize-icon.icon(src="@/assets/resize-corner.svg" :class="resizeColorClass")

</template>

<style lang="stylus">
.list
  position absolute
  border-radius var(--entity-radius)
  min-width 70px
  min-height 200px
  &.hover
    box-shadow var(--hover-shadow)
  &.active
    box-shadow var(--active-shadow)
    transition none
    z-index 1

  .list-info
    pointer-events all
    // background-color pink !important
    border-radius var(--entity-radius)
    border-bottom-left-radius 0
    border-bottom-right-radius 0
    cursor pointer
    &.is-background-light
      color var(--primary-on-light-background)
      button
        border-color var(--primary-border-on-light-background)
        color var(--primary-on-light-background)
        .icon
          filter none
    &.is-background-dark
      color var(--primary-on-dark-background)
      button
        border-color var(--primary-border-on-dark-background)
        color var(--primary-on-dark-background)
        .icon
          filter invert()
    &:hover
      box-shadow var(--hover-shadow)
    &:active
      box-shadow var(--active-shadow)

    .inline-button-wrap
      display inline-block
    button
      width initial
      min-width 20px
      // background transparent
      cursor pointer
      .icon.left-arrow
        vertical-align 0
        margin-left 3px
      .icon.add
        width 8px
        margin-left 1px
    .inline-button
      background transparent
    .inline-button-wrap + .inline-button-wrap
      padding-left 0

    .locking-frame
      position absolute
      z-index -1
      pointer-events none

</style>
