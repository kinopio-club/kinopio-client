<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'

import utils from '@/utils.js'
import consts from '@/consts.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()

const isResizing = computed(() => globalStore.currentUserIsResizingCardDetails)
const start = (event) => {
  if (utils.isMultiTouch(event)) { return }
  globalStore.preventDraggedCardFromShowingDetails = true
  console.log('📧📧📧📧', event)
  globalStore.currentUserIsResizingCardDetails = true
}

const remove = (event) => {
  globalStore.currentUserIsResizingCardDetails = false
  userStore.updateUser({ cardDetailsResizeWidth: consts.defaultDialogWidth })
}
</script>

<template lang="pug">
.right-resize.card-details-resize-wrap.bottom-button-wrap(@click.stop)
  .inline-button-wrap(
    @mousedown.left.stop="start"
    @touchstart.stop="start"
    @dblclick="remove"
    title="Drag to Resize"
  )
    button.inline-button(tabindex="-1" :class="{active: isResizing}")
      img.icon(src="@/assets/resize-corner.svg")
</template>

<style lang="stylus">
.card-details
  .card-details-resize-wrap
    pointer-events all
    position absolute
    right -5px
    bottom 2px
    display flex
    .inline-button-wrap
      margin-right 0
      margin-top 0
      padding-top 0
      padding-bottom 0
      z-index 1
      cursor ew-resize
      button
        cursor ew-resize
        box-shadow none
      &:hover
        button
          box-shadow none
          background var(--light-shadow) !important
      &.active,
      &:active
        button
          box-shadow none
          background var(--heavy-shadow) !important
    .icon
      -webkit-user-drag none
      user-drag none
      position absolute
      left 0
      top 0
    .right-resize
      .inline-button-wrap
        padding-left 0
</style>
