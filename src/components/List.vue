<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useListStore } from '@/stores/useListStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'

// import { colord, extend } from 'colord'

const globalStore = useGlobalStore()
const listStore = useListStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

// let unsubscribes

const borderWidth = 2

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
  )
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
</style>
