<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Comments from '@/components/dialogs/Comments.vue'

const store = useStore()

const commentModeElement = ref(null)
const toggleCommentElement = ref(null)

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
const shouldIncreaseUIContrast = computed(() => store.state.currentUser.shouldIncreaseUIContrast)
const blurButtons = () => {
  let element = commentModeElement.value
  element.blur()
  element = toggleCommentElement.value
  element.blur()
}

// comment mode

const canOnlyComment = computed(() => store.getters['currentUser/canOnlyComment']())
const isCommentMode = computed(() => store.state.isCommentMode)
const toggleCommentMode = () => {
  const value = !isCommentMode.value
  store.commit('isCommentMode', value)
  blurButtons()
}
const commentTitle = computed(() => {
  if (canOnlyComment.value) {
    return 'Only collaborators can toggle comment mode'
  } else {
    return 'Comment Mode'
  }
})

// comments dialog

const toggleCommentsIsVisible = () => {
  const value = !state.commentsIsVisible
  store.dispatch('closeAllDialogs')
  state.commentsIsVisible = value
  blurButtons()
}
</script>

<template lang="pug">
.segmented-buttons.space-functions-row.comment-buttons(v-if="currentUserIsSignedIn")
  .button-wrap(:title="commentTitle")
    button(
      :class="{ 'translucent-button': !shouldIncreaseUIContrast, active: isCommentMode }"
      @click="toggleCommentMode"
      ref='commentModeElement'
      :disabled="canOnlyComment"
    )
      img.icon.comment(src="@/assets/comment.svg")
    .label-badge.comment-mode-badge-wrap(v-if="isCommentMode")
      span Comment Mode
  .button-wrap
    button(:class="{ 'translucent-button': !shouldIncreaseUIContrast, active: state.commentsIsVisible }" @click="toggleCommentsIsVisible" ref="toggleCommentElement")
      img.icon.button-down-arrow(src="@/assets/down-arrow.svg")
    Comments(:visible="state.commentsIsVisible")
</template>

<style lang="stylus">
.comment-buttons
  margin-left 6px
  margin-right 6px
</style>
