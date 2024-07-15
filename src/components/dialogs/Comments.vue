<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import CommentList from '@/components/CommentList.vue'

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    }
  })
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
    store.commit('shouldExplicitlyHideFooter', true)
  } else {
    store.commit('shouldExplicitlyHideFooter', false)
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const currentUser = computed(() => store.state.currentUser)
const filterComments = computed(() => currentUser.value.filterComments)
const toggleFilterComments = () => {
  const value = !filterComments.value
  store.dispatch('currentUser/toggleFilterComments', value)
}

// comment mode

const isCommentMode = computed(() => store.state.isCommentMode)
const toggleCommentMode = (event) => {
  const value = !isCommentMode.value
  store.commit('isCommentMode', value)
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
