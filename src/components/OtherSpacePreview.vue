<script setup>
import Loader from '@/components/Loader.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const props = defineProps({
  otherSpace: Object,
  isActive: Boolean,
  url: String,
  parentCardId: String
})

const otherSpaceIsPrivate = computed(() => {
  if (!props.otherSpace.privacy) { return }
  return props.otherSpace.privacy === 'private'
})
const isLoadingOtherItems = computed(() => store.state.isLoadingOtherItems)

// dialog
const showOtherSpaceDetailsIsVisible = (event) => {
  if (utils.isMultiTouch(event)) { return }
  if (store.state.preventDraggedCardFromShowingDetails) { return }
  let otherItem = {}
  if (props.otherItem) {
    otherItem = utils.clone(props.otherSpace)
  }
  if (props.parentCardId) {
    otherItem.parentCardId = props.parentCardId
    store.dispatch('currentCards/incrementZ', props.parentCardId)
  }
  store.dispatch('closeAllDialogs')
  store.commit('currentUserIsDraggingCard', false)
  const rect = event.target.getBoundingClientRect()
  store.commit('otherItemDetailsPosition', rect)
  store.commit('currentSelectedOtherItem', otherItem)
  store.commit('otherSpaceDetailsIsVisible', true)
  store.commit('triggerCancelLocking')
  store.commit('currentUserIsDraggingCard', false)
}

</script>

<template lang="pug">
a.other-space-preview(:href="props.url" ref="badge")
  .badge.button-badge.link-badge(:class="{ active: isActive }" @click.stop.prevent="showOtherSpaceDetailsIsVisible($event)")
    template(v-if="otherSpace")
      template(v-if="otherSpace.users")
        UserLabelInline(:user="otherSpace.users[0]" :shouldHideName="true")
      span {{otherSpace.name}}
      img.icon.private(v-if="otherSpaceIsPrivate" src="@/assets/lock.svg")
    template(v-else)
      Loader(:visible="true" :isSmall="true" :isStatic="!isLoadingOtherItems")
      span Space

</template>

<style lang="stylus">
.other-space-preview
  text-decoration none
  // word-wrap break-word

</style>
