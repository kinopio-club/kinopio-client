<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'

const store = useStore()

const maxIterations = 200 // 👀 MagicPaint maxIterations
let visibleTimer, currentIteration

onMounted(() => {
  store.subscribe((mutation) => {
    if (mutation.type === 'triggerUpdateRemoteUserCursor') {
      const cursor = mutation.payload
      if (cursor.userId !== props.user.id) { return }
      state.x = cursor.x
      state.y = cursor.y
      state.color = props.user.color
      currentIteration = 0
      userLabelVisibleTimer()
      checkIsOnscreen()
      offscreenLabelPosition()
    }
  })
})

const props = defineProps({
  user: Object
})

const state = reactive({
  x: 0,
  y: 0,
  color: '',
  visible: false,
  isOnscreen: true,
  isOffscreenX: false,
  isOffscreenY: false
})

// user

const userHasName = computed(() => Boolean(props.user.name))
const backgroundColor = computed(() => {
  return {
    background: props.user.color
  }
})
const colorIsDark = computed(() => utils.colorIsDark(props.user.color))

// position

const position = computed(() => {
  return {
    left: state.x + 'px',
    top: state.y + 'px'
  }
})
const scroll = computed(() => store.getters.windowScrollWithSpaceOffset())
const checkIsOnscreen = () => {
  const zoom = store.getters.spaceCounterZoomDecimal
  const viewportWidth = store.state.viewportWidth * zoom
  const viewportHeight = store.state.viewportHeight * zoom
  const isBetweenX = utils.isBetween({
    value: state.x,
    min: scroll.value.x,
    max: scroll.value.x + viewportWidth
  })
  const isBetweenY = utils.isBetween({
    value: state.y,
    min: scroll.value.y,
    max: scroll.value.y + viewportHeight
  })
  state.isOffscreenX = !isBetweenX
  state.isOffscreenY = !isBetweenY
  state.isOnscreen = isBetweenX && isBetweenY
}
const offscreenLabelPosition = () => {
  if (state.isOnscreen) { return }
  const minX = scroll.value.x
  const maxX = scroll.value.x + store.state.viewportWidth
  const minY = scroll.value.y
  const maxY = scroll.value.y + store.state.viewportHeight
  // left side
  if (state.isOffscreenX && state.x < minX) {
    state.x = minX - 4
  }
  // right side
  if (state.isOffscreenX && state.x > maxX) {
    state.x = maxX - 22
  }
  // top side
  if (state.isOffscreenY && state.y < minY) {
    state.y = minY - 2
  }
  // bottom side
  if (state.isOffscreenY && state.y > maxY) {
    state.y = maxY - 16
  }
}

// visible

const userLabelVisibleTimer = () => {
  state.visible = true
  if (!visibleTimer) {
    currentIteration = 0
    visibleTimer = window.requestAnimationFrame(userLabelVisibleFrame)
  }
}
const userLabelVisibleFrame = () => {
  currentIteration++
  if (currentIteration < maxIterations) {
    window.requestAnimationFrame(userLabelVisibleFrame)
  } else {
    setTimeout(() => {
      window.cancelAnimationFrame(visibleTimer)
      visibleTimer = undefined
      state.visible = false
    }, 0)
  }
}
</script>

<template lang="pug">
.user-label.user-label-cursor(v-if="state.visible" :data-id="user.id" :style="position")
  .pointer(v-if="state.isOnscreen")
    svg(width="13px" height="14px" viewBox="0 0 13 14" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink")
      g(stroke="none" stroke-width="1" fill="none" fill-rule="evenodd")
        path(:fill="state.color" d="M4.3472708,-1.34216658 L10.8472708,10.3578334 C7.96172333,8.79783342 5.79505666,8.01783342 4.3472708,8.01783342 C2.89948494,8.01783342 0.732818273,8.79783342 -2.1527292,10.3578334 L4.3472708,-1.34216658 Z" transform="translate(4.347271, 4.507833) rotate(-42.000000) translate(-4.347271, -4.507833) ")
  .badge(:style="backgroundColor" :class="{'is-off-screen': !state.isOnscreen}")
    .user-avatar
      img.anon-avatar(src="@/assets/anon-avatar.svg" :class="{ 'is-dark': colorIsDark }")
    span.user-name(v-if="state.isOnscreen && userHasName" :class="{ 'is-dark': colorIsDark }") {{ user.name }}
</template>

<style lang="stylus">
.user-label
  pointer-events none
  position absolute
  z-index calc(var(--max-z) - 50)
  display inline-block
  border-radius var(--small-entity-radius)
  .pointer
    width 15px
    height 15px
  .badge
    margin 0
    margin-left 10px
    margin-top -5px
    &.is-off-screen
      margin 0
  .user-avatar
    width 12px
    display inline-block
  .anon-avatar
    left 4px
    top 7px
    width 14px
  .user-name
    margin-left 6px
    &.is-dark
      filter invert(1)
</style>
