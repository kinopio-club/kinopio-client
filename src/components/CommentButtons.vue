<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

const commentModeElement = ref(null)

const shouldIncreaseUIContrast = computed(() => store.state.currentUser.shouldIncreaseUIContrast)

const isCommentMode = computed(() => store.state.isCommentMode)
const toggleCommentMode = () => {
  const value = !isCommentMode.value
  store.commit('isCommentMode', value)
  const element = commentModeElement.value
  element.blur()
}
</script>

<template lang="pug">
.segmented-buttons.space-functions-row.comment-buttons
  .button-wrap
    button(:class="{ 'translucent-button': !shouldIncreaseUIContrast, active: isCommentMode }" @click="toggleCommentMode" title="Comment Mode" ref='commentModeElement')
      img.icon.comment(src="@/assets/comment.svg")
      .label-badge.comment-mode-badge-wrap(v-if="isCommentMode")
        span Comment Mode
  .button-wrap
    button(:class="{ 'translucent-button': !shouldIncreaseUIContrast }")
      img.icon.button-down-arrow(src="@/assets/down-arrow.svg")
</template>

<style lang="stylus">
.comment-buttons
  margin-right 6px
</style>
