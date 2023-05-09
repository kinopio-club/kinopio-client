<script setup>
import Loader from '@/components/Loader.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const props = defineProps({
  otherSpace: Object,
  url: String,
  parentCardId: String,
  shouldCloseAllDialogs: Boolean,
  shouldTruncateName: Boolean,
  isInvite: Boolean
})

const otherSpaceIsPrivate = computed(() => {
  if (!props.otherSpace.privacy) { return }
  return props.otherSpace.privacy === 'private'
})
const isLoadingOtherItems = computed(() => store.state.isLoadingOtherItems)

const isActive = computed(() => {
  const isFromParentCard = store.state.currentSelectedOtherItem.parentCardId === props.parentCardId
  const otherSpaceDetailsIsVisible = store.state.otherSpaceDetailsIsVisible
  return otherSpaceDetailsIsVisible && isFromParentCard
})

const otherSpaceName = computed(() => {
  let name = props.otherSpace.name
  if (props.shouldTruncateName) {
    name = utils.truncated(name, 15)
  }
  return name
})

// dialog
const showOtherSpaceDetailsIsVisible = (event) => {
  if (utils.isMultiTouch(event)) { return }
  if (store.state.preventDraggedCardFromShowingDetails) { return }
  let otherItem = {}
  if (props.otherSpace) {
    otherItem = utils.clone(props.otherSpace)
  }
  if (props.parentCardId) {
    otherItem.parentCardId = props.parentCardId
    store.dispatch('currentCards/incrementZ', props.parentCardId)
  }
  otherItem.url = props.url
  otherItem.isInvite = props.isInvite
  if (props.shouldCloseAllDialogs) {
    store.dispatch('closeAllDialogs')
  }
  store.commit('currentUserIsDraggingCard', false)
  const position = utils.cursorPositionInSpace(event)
  store.commit('otherItemDetailsPosition', position)
  store.commit('currentSelectedOtherItem', otherItem)
  store.commit('otherSpaceDetailsIsVisible', true)
  store.commit('triggerCancelLocking')
  store.commit('currentUserIsDraggingCard', false)
  store.commit('otherCardDetailsIsVisible', false)
  event.stopPropagation()
}

</script>

<template lang="pug">
a.other-space-preview(@click.prevent.stop :href="props.url" ref="badge")
  .badge.button-badge.link-badge(:class="{ active: isActive }" @mouseup.prevent="showOtherSpaceDetailsIsVisible($event)" @touchend.prevent="showOtherSpaceDetailsIsVisible($event)")
    template(v-if="props.isInvite")
      .badge.info Invite
    template(v-if="props.otherSpace")
      template(v-if="props.otherSpace.users")
        UserLabelInline(:user="props.otherSpace.users[0]" :shouldHideName="true")
      span {{otherSpaceName}}
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
