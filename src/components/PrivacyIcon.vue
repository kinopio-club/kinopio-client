<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import privacy from '@/data/privacy.js'
const store = useStore()

const props = defineProps({
  privacy: String,
  closedIsNotVisible: Boolean
})

const privacyState = computed(() => {
  return privacy.states().find(state => {
    return state.name === props.privacy
  })
})
const isOpen = computed(() => privacyState.value.name === 'open')
const isClosed = computed(() => privacyState.value.name === 'closed' && !props.closedIsNotVisible)
const isPrivate = computed(() => privacyState.value.name === 'private')
</script>

<template lang="pug">
img.icon.privacy-icon(
  v-if="isOpen"
  src="@/assets/comment.svg"
  :class="privacyState.name"
)
img.icon.privacy-icon(
  v-else-if="isClosed"
  src="@/assets/unlock.svg"
  :class="privacyState.name"
)
img.icon.privacy-icon(
  v-else-if="isPrivate"
  src="@/assets/lock.svg"
  :class="privacyState.name"
)
</template>

<style lang="stylus">
.icon.privacy-icon
  vertical-align 0
  &.open
    vertical-align -1px
</style>
