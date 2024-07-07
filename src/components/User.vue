<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import UserDetailsInline from '@/components/dialogs/UserDetailsInline.vue'
import utils from '@/utils.js'
const store = useStore()

const userElement = ref(null)

onMounted(() => {
  state.userDetailsInlineIsVisible = false
  store.subscribe((mutation, state) => {
    if (mutation.type === 'closeAllDialogs') {
      closeChildDialogs()
    }
  })
})

const props = defineProps({
  isClickable: Boolean,
  user: Object,
  detailsOnRight: Boolean,
  shouldCloseAllDialogs: Boolean,
  hideYouLabel: Boolean,
  isSmall: Boolean,
  isMedium: Boolean,
  userDetailsIsInline: Boolean,
  shouldBounceIn: Boolean
})

const state = reactive({
  userDetailsInlineIsVisible: false
})

const userId = computed(() => {
  if (!props.user) { return }
  return props.user.id
})
const userColor = computed(() => {
  if (!props.user) { return }
  return props.user.color
})
const isCurrentUser = computed(() => {
  if (!props.user) { return }
  return props.user.id === store.state.currentUser.id
})
const userDetailsIsVisible = computed(() => store.state.userDetailsIsVisible)
const userDetailsIsUser = computed(() => {
  const userDetailsUser = store.state.userDetailsUser
  return props.user.id === userDetailsUser.id
})
const userDetailsIsVisibleForUser = computed(() => userDetailsIsVisible.value && userDetailsIsUser.value)
const colorIsDark = computed(() => utils.colorIsDark(userColor.value))

const toggleUserDetailsIsVisible = () => {
  if (props.userDetailsIsInline) {
    toggleUserDetailsInlineIsVisible()
  } else {
    toggleUserDetailsGlobalIsVisible()
  }
}
const toggleUserDetailsInlineIsVisible = () => {
  const value = !state.userDetailsInlineIsVisible
  store.commit('closeAllDialogs')
  state.userDetailsInlineIsVisible = value
}
const toggleUserDetailsGlobalIsVisible = () => {
  const isVisible = userDetailsIsVisibleForUser.value
  if (props.shouldCloseAllDialogs) {
    store.dispatch('closeAllDialogs')
  }
  if (isVisible) {
    store.commit('userDetailsIsVisible', false)
    return
  }
  showUserDetails()
}
const showUserDetails = () => {
  const element = userElement.value
  let options = { element, shouldIgnoreZoom: true }
  if (props.detailsOnRight) {
    options.offsetX = -190
    options.transformOriginIsTopRight = true
  }
  const position = utils.childDialogPositionFromParent(options)
  store.commit('userDetailsUser', props.user)
  store.commit('userDetailsPosition', position)
  store.commit('userDetailsIsVisible', true)
}
const closeChildDialogs = () => {
  state.userDetailsInlineIsVisible = false
}
</script>

<template lang="pug">
.user(
  :title="user.name"
  :data-user-id="userId"
  :key="userId"
  ref="userElement"
  @keydown.stop.enter="toggleUserDetailsIsVisible"
  :class="{active: userDetailsIsVisibleForUser, 'is-small': isSmall, 'is-medium': isMedium }"
)
  .user-avatar(
    @mouseup.left.stop="toggleUserDetailsIsVisible"
    @touchend.stop="toggleUserDetailsIsVisible"
    :class="{ clickable: isClickable }"
    :style="{backgroundColor: userColor}"
  )
    img.anon-avatar(src="@/assets/anon-avatar.svg" :class="{ 'is-dark': colorIsDark, 'bounce-in': shouldBounceIn }")
  .label-badge.you-badge.small-badge(v-if="isCurrentUser && !hideYouLabel")
    span YOU
  template(v-if="state.userDetailsInlineIsVisible && user")
    UserDetailsInline(:visible="state.userDetailsInlineIsVisible" :user="user" :showExploreSpaces="true")
</template>

<style lang="stylus">
.user
  display inline-block
  position relative
  &:hover,
  &:active
    outline none
  &.active
    outline none
  .user-avatar
    width 30px
    height 30px
    border-radius var(--entity-radius)
    pointer-events none
    background-color var(--secondary-active-background)
    &:hover,
    &:focus
      box-shadow var(--button-hover-shadow)
    &:active,
    &.active
      box-shadow var(--button-active-inset-shadow)
    &.clickable
      cursor pointer
      pointer-events all
    .anon-avatar
      left 7px
  &.is-small
    .user-avatar
      width 17px
      height 17px
      border-radius var(--small-user-avatar-radius)
      .anon-avatar
        left 3px
        top 6px
        width 10.5px
  &.is-medium
    .user-avatar
      width 22px
      height 22px
      .anon-avatar
        left 4px
        top 8px
        width 14px

  .label-badge
    bottom -7px
    width initial
  .you-badge
    width max-content
    min-width 100%
button
  .user
    margin 0
    margin-right 6px
    vertical-align middle
    border-radius var(--small-user-avatar-radius)
    .user-avatar
      width 15px
      height 14px
      margin-top -2px
      .anon-avatar
        left 2px
        top 3px
        width 10.5px

.bounce-in
  animation bounce 0.5s ease-out
@keyframes bounce
  0%
    transform translateY(0)
  100%
    transform translateY(4px)
</style>
