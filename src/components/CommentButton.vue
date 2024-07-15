<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Comments from '@/components/dialogs/Comments.vue'

const store = useStore()

const buttonElement = ref(null)

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'closeAllDialogs') {
      state.commentsIsVisible = false
    }
  })
})

const state = reactive({
  commentsIsVisible: false
})

const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const canOnlyComment = computed(() => store.getters['currentUser/canOnlyComment']())
const isVisible = computed(() => {
  if (canOnlyComment.value) { return }
  return currentUserIsSignedIn.value
})
const shouldIncreaseUIContrast = computed(() => store.state.currentUser.shouldIncreaseUIContrast)
const blur = () => {
  const element = buttonElement.value
  element.blur()
}

const isCommentMode = computed(() => store.state.isCommentMode)
const toggleCommentsIsVisible = () => {
  const value = !state.commentsIsVisible
  store.dispatch('closeAllDialogs')
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
