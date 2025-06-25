<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import Comments from '@/components/dialogs/Comments.vue'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const buttonElement = ref(null)
let unsubscribes

onMounted(() => {
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'closeAllDialogs') {
        state.commentsIsVisible = false
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

const state = reactive({
  commentsIsVisible: false
})

const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const canOnlyComment = computed(() => userStore.getUserIsCommentOnly)
const isVisible = computed(() => {
  if (canOnlyComment.value) { return }
  return currentUserIsSignedIn.value
})
const shouldIncreaseUIContrast = computed(() => userStore.shouldIncreaseUIContrast)
const blur = () => {
  const element = buttonElement.value
  element.blur()
}

const isCommentMode = computed(() => globalStore.isCommentMode)
const toggleCommentsIsVisible = () => {
  const value = !state.commentsIsVisible
  globalStore.closeAllDialogs()
  state.commentsIsVisible = value
  blur()
}
</script>

<template lang="pug">
.button-wrap.comment-button(v-if="isVisible")
  button(:class="{ 'translucent-button': !shouldIncreaseUIContrast, active: state.commentsIsVisible }" @click="toggleCommentsIsVisible" ref="buttonElement")
    img.icon.comment(src="@/assets/comment.svg")
  Comments(:visible="state.commentsIsVisible")
  .label-badge.comment-mode-badge-wrap(v-if="isCommentMode")
    span Comment Mode
</template>

<style lang="stylus">
</style>
