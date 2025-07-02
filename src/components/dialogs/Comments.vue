<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'
import CommentList from '@/components/CommentList.vue'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  dialogHeight: null
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
    globalStore.shouldExplicitlyHideFooter = true
  } else {
    globalStore.shouldExplicitlyHideFooter = false
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const filterComments = computed(() => userStore.filterComments)
const toggleFilterComments = () => {
  const value = !filterComments.value
  userStore.updateUser({ filterComments: value })
}

// comment mode

const isCommentMode = computed(() => globalStore.isCommentMode)
const toggleCommentMode = (event) => {
  const value = !isCommentMode.value
  globalStore.isCommentMode = value
}

</script>

<template lang="pug">
dialog.narrow.comments(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    .row
      .button-wrap
        button(
          :class="{ active: isCommentMode }"
          @click="toggleCommentMode"
          ref='commentModeElement'
          title="Comment Mode"
        )
          img.icon.comment(src="@/assets/comment.svg")
          span Comment Mode
    .row(v-if="isCommentMode")
      .badge.info New Cards will be Comments
    .row
      label(title="Toggle Hide Comment Cards (4)" :class="{active: filterComments}" @click.left.prevent.stop="toggleFilterComments" @keydown.stop.enter="toggleFilterComments")
        input(type="checkbox" v-model="filterComments")
        img.icon.comment(src="@/assets/comment.svg")
        span Hide
  CommentList
</template>

<style lang="stylus">
dialog.comments
  left initial
  right 6px
  overflow auto
</style>
