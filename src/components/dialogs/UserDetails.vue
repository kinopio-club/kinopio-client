<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import UserDetailsInfo from '@/components/UserDetailsInfo.vue'
import UserDetailsActions from '@/components/UserDetailsActions.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()

const dialogElement = ref(null)
let unsubscribes

onMounted(() => {
  const globalStoreUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerScrollUserDetailsIntoView' && visible.value) {
        scrollUserDetailsIntoView()
      }
    }
  )
  unsubscribes = () => {
    globalStoreUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

const visible = computed(() => globalStore.userDetailsIsVisible)
const user = computed(() => globalStore.userDetailsUser)
const position = computed(() => globalStore.userDetailsPosition)

const styles = computed(() => {
  let { x, y, shouldIgnoreZoom, transformOriginIsTopRight } = position.value
  let zoom = globalStore.getSpaceCounterZoomDecimal
  if (shouldIgnoreZoom) {
    zoom = 1
  }
  if (globalStore.isTouchDevice) {
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
  globalStore.scrollElementIntoView({ element })
}

</script>

<template lang="pug">
dialog.narrow.user-details(v-if="visible" @keyup.stop :open="visible" @click.left.stop="closeDialogs" @keydown.stop :style="styles" ref="dialogElement")
  UserDetailsInfo(:user="user" :showUserBadges="true")
  UserDetailsActions(:user="user")
</template>

<style lang="stylus">
dialog.user-details
  cursor initial
  top calc(100% - 8px)
  position absolute
</style>
