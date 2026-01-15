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

const minListSize = 200
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
  return utils.colorIsDark(color.value)
})
// const fillColor = computed(() => {
//   let value = color.value
//   value = colord(value).alpha(0.5).toRgbString()
//   return value
// })
const listStyles = computed(() => {
  const { x, y, z } = props.list
  const width = props.list.resizeWidth
  const styles = {
    left: x + 'px',
    top: y + 'px',
    zIndex: z || 1,
    width: width + 'px',

    // todo move to box bk
    // ?border: `${borderWidth}px solid ${color.value}`,
    backgroundColor: color.value
  }
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
  const classes = utils.colorClasses({ backgroundColor: color.value })
  if (state.isHover) {
    classes.push('hover')
  }
  return classes
})
const infoStyles = computed(() => {
  const { x, y } = props.list
  const width = props.list.resizeWidth
  const styles = {
    left: x + 'px',
    top: y + 'px',
    width: width + 'px',
    backgroundColor: color.value
  }
  return styles
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

// actions

const toggleIsCollapsed = () => {
  const value = !props.list.isCollapsed
  listStore.updateList({
    id: props.list.id,
    isCollapsed: value
  })
}
const addCard = () => {
  // TODO get prepended list pos
  // create card w listId and listPosition
  console.log('addCard', props.list.id)
}

// resize

const resizeIsVisible = computed(() => {
  if (!canEditSpace.value) { return }
  if (userStore.getUserIsCommentOnly) { return }
  return true
})
const startResizing = (event) => {
  if (!canEditSpace.value) { return }
  if (utils.isMultiTouch(event)) { return }
  globalStore.closeAllDialogs()
  globalStore.currentUserIsResizingList = true
  globalStore.preventMultipleSelectedActionsIsVisible = true
  let listIds = [props.list.id]
  const multipleListsSelectedIds = globalStore.multipleListsSelectedIds
  if (multipleListsSelectedIds.length) {
    listIds = multipleListsSelectedIds
  }
  globalStore.currentUserIsResizingListIds = listIds
  const updates = {
    userId: userStore.id,
    listIds
  }
  broadcastStore.update({ updates, action: 'updateRemoteUserResizingLists' })
  event.preventDefault() // allows resizing list without scrolling on mobile
}
const resizeButtonColorClass = computed(() => {
  const classes = utils.colorClasses({ backgroundColor: color.value })
  return [classes]
})
const resetWidth = () => {
  listStore.updateList({
    id: props.list.id,
    resizeWidth: minListSize
  })
  // ??? TODO update computed height
}

</script>

<template lang="pug">
.list(
  :key="list.id"
  :data-list-id="list.id"
  :data-x="list.x"
  :data-y="list.y"
  :data-width="list.resizeWidth"
  :data-is-collapsed="list.isCollapsed"
  :style="listStyles"
  :class="classes"
  ref="listElement"
)
  teleport(to="#list-infos")
    .list-info(
      :data-list-id="list.id"
      :class="infoClasses"
      :style="infoStyles"
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
        //- toggle collapse
        .inline-button-wrap
          button.small-button.inline-button(title="Toggle Collapsed" @click.left.stop="toggleIsCollapsed")
            img.icon.down-arrow(v-if="!props.list.isCollapsed" src="@/assets/down-arrow.svg")
            img.icon.right-arrow(v-else src="@/assets/right-arrow.svg")
            span {{ listCards.length }}
        //- add card
        .inline-button-wrap
          button.small-button.inline-button(title="Add Card" @click.left.stop="addCard")
            img.icon.add(src="@/assets/add.svg")
        span.name(:title="props.list.name") {{ props.list.name }}
        //- resize when list is collapsed
        .bottom-button-wrap(v-if="props.list.isCollapsed && resizeIsVisible" :class="{unselectable: isPaintSelecting}")
          .inline-button-wrap(
              @pointerover="updateIsHover(true)"
              @pointerleave="updateIsHover(false)"
              @mousedown.left="startResizing"
              @touchstart="startResizing"
              @dblclick="resetWidth"
            )
            button.inline-button(
              tabindex="-1"
            )
              img.resize-icon.icon(src="@/assets/resize-corner.svg" :class="resizeButtonColorClass")

  teleport(to="#list-contents")
    .list-content(
      v-if="!props.list.isCollapsed"
      :data-list-id="list.id"
      :style="listStyles"
      :class="classes"
    )
      .placeholder(v-if="!listCards.length")
      //- resize when list is not collapsed
      .bottom-button-wrap(v-if="!props.list.isCollapsed && resizeIsVisible" :class="{unselectable: isPaintSelecting}")
        .inline-button-wrap(
            @pointerover="updateIsHover(true)"
            @pointerleave="updateIsHover(false)"
            @mousedown.left="startResizing"
            @touchstart="startResizing"
            @dblclick="resetWidth"
          )
          button.inline-button(
            tabindex="-1"
          )
            img.resize-icon.icon(src="@/assets/resize-corner.svg" :class="resizeButtonColorClass")

</template>

<style lang="stylus">
:root
  --min-list-size 200px // matches minListSize var

.list
  position absolute
  border-radius var(--entity-radius)
  min-width var(--min-list-size)
  // resize
  .bottom-button-wrap
    .inline-button-wrap
      cursor nwse-resize
      button
        cursor nwse-resize
      .resize-icon
        top 0
        left 0

.list-content
  min-width var(--min-list-size)
  position absolute
  margin-top 34px
  padding 8px
  padding-top 0
  border-radius var(--entity-radius)
  border-top-left-radius 0
  border-top-right-radius 0
  .placeholder
    background-color var(--light-shadow)
    border-radius var(--entity-radius)
    box-shadow var(--button-active-inset-shadow)
    padding 8px
    height 33px // shortest card height
    span
      pointer-events all
      color white
  &.hover
    box-shadow var(--hover-shadow)
  &.active
    box-shadow var(--active-shadow)
    transition none
    z-index 1

.list-info
  min-width var(--min-list-size)
  pointer-events all
  border-radius var(--entity-radius)
  cursor pointer
  z-index 1
  display flex
  align-items center
  width max-content
  position absolute
  border-radius var(--entity-radius)
  border-bottom-left-radius 0
  border-bottom-right-radius 0
  &.is-background-light
    color var(--primary-on-light-background)
    button
      border-color var(--primary-border-on-light-background)
      color var(--primary-on-light-background) !important
      .icon
        filter none
  &.is-background-dark
    color var(--primary-on-dark-background)
    button
      border-color var(--primary-border-on-dark-background)
      color var(--primary-on-dark-background) !important
      .icon
        filter invert()
  &:hover
    box-shadow var(--hover-shadow)
  &:active
    box-shadow var(--active-shadow)
  // buttons
  .inline-button-wrap
    display inline-block
  button
    width initial
    min-width 20px
    cursor pointer
    .icon.down-arrow
      vertical-align 1px
      margin 0
    .icon.right-arrow
      transform none
      vertical-align 1px
      margin-left 5px
      margin-right 1px
    .icon.add
      width 8px
      margin-left 1px
  .inline-button
    background transparent !important // :hover and :active are transparent too
  .inline-button-wrap + .inline-button-wrap
    padding-left 0
  .row
    width 100%
    .name
      white-space nowrap
      overflow hidden
      text-overflow ellipsis
      display inline-block
      width calc(100% - 85px)
      vertical-align -2px
  .bottom-button-wrap // resize when list is collapsed
    right -12px

  .locking-frame
    position absolute
    z-index -1
    pointer-events none
</style>
