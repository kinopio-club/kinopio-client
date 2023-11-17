<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick, defineAsyncComponent } from 'vue'
import { useStore } from 'vuex'

import UserDetailsContent from '@/components/UserDetailsContent.vue'
import utils from '@/utils.js'

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerScrollUserDetailsIntoView' && visible.value) {
      scrollUserDetailsIntoView()
    }
  })
})

const visible = computed(() => store.state.userDetailsIsVisible)
const user = computed(() => store.state.userDetailsUser)

const userDetailsPosition = computed(() => store.state.userDetailsPosition)
const spaceCounterZoomDecimal = computed(() => store.getters.spaceCounterZoomDecimal)

const styles = computed(() => {
  let { x, y, shouldIgnoreZoom, transformOriginIsTopRight } = userDetailsPosition.value
  let zoom = spaceCounterZoomDecimal.value
  if (shouldIgnoreZoom) {
    zoom = 1
  }
  if (store.state.isTouchDevice) {
    zoom = utils.pinchCounterZoomDecimal()
    if (zoom > 1) {
      x = x * zoom
      y = y * zoom
    }
  }
  const styles = {
    transform: `scale(${zoom})`,
    left: x + 'px',
    top: y + 'px'
  }
  if (transformOriginIsTopRight) {
    styles.transformOrigin = 'top right'
  }
  return styles
})

const scrollUserDetailsIntoView = async () => {
  await nextTick()
  const element = dialogElement.value
  utils.scrollIntoView({ element })
}

</script>

<template lang="pug">
dialog.narrow.user-details(v-if="visible" @keyup.stop :open="visible" @click.left.stop="closeDialogs" @keydown.stop :style="styles" ref="dialogElement")
  UserDetailsContent(:user="user")
</template>

<style lang="stylus">
.user-details
  cursor initial
  top calc(100% - 8px)
  position absolute
</style>
