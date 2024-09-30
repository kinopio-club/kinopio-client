<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, useTemplateRef, nextTick } from 'vue'
import { useStore } from 'vuex'

import UserDetailsInfo from '@/components/UserDetailsInfo.vue'
import UserDetailsActions from '@/components/UserDetailsActions.vue'
import utils from '@/utils.js'

const store = useStore()

const dialogElement = useTemplateRef('dialogElement')

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
  window.addEventListener('scroll', updateDialogHeight)
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerScrollUserDetailsIntoView' && visible.value) {
      scrollUserDetailsIntoView()
    }
  })
})

const state = reactive({
  dialogHeight: null
})

const visible = computed(() => store.state.userDetailsIsVisible)
watch(() => visible.value, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
  }
})
const updateDialogHeight = async () => {
  if (!visible.value) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const user = computed(() => store.state.userDetailsUser)
const position = computed(() => store.state.userDetailsPosition)

const styles = computed(() => {
  let { x, y, shouldIgnoreZoom, transformOriginIsTopRight } = position.value
  let zoom = store.getters.spaceCounterZoomDecimal
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
    top: y + 'px',
    maxHeight: state.dialogHeight + 'px'
  }
  if (transformOriginIsTopRight) {
    styles.transformOrigin = 'top right'
  }
  return styles
})

const scrollUserDetailsIntoView = async () => {
  await nextTick()
  const element = dialogElement.value
  store.commit('scrollElementIntoView', { element })
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
  overflow auto
</style>
