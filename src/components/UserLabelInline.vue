<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import consts from '@/consts.js'

const store = useStore()

const labelElement = ref(null)

const props = defineProps({
  user: Object,
  isClickable: Boolean,
  shouldHideName: Boolean,
  title: String,
  isOnDarkBackground: Boolean
})

// user

const userHasName = computed(() => Boolean(props.user.name))
const colorIsDark = computed(() => utils.colorIsDark(props.user.color))
const shouldBounce = computed(() => {
  if (consts.userPrefersReducedMotion()) { return }
  return props.user.isOnline
})

// user details

const userDetailsIsVisible = computed(() => store.state.userDetailsIsVisible)
const userDetailsIsUser = computed(() => {
  const userDetailsUser = store.state.userDetailsUser
  return props.user.id === userDetailsUser.id
})
const userDetailsIsVisibleForUser = computed(() => userDetailsIsVisible.value && userDetailsIsUser.value)
const toggleUserDetailsIsVisible = () => {
  if (!props.isClickable) { return }
  event.stopPropagation()
  const isVisible = userDetailsIsVisibleForUser.value
  if (isVisible) {
    store.commit('userDetailsIsVisible', false)
    return
  }
  showUserDetails()
}
const showUserDetails = () => {
  const element = labelElement.value
  let options = { element, shouldIgnoreZoom: true }
  // if (this.detailsOnRight) {
  //   options.offsetX = -190
  // }
  const position = utils.childDialogPositionFromParent(options)
  store.commit('userDetailsUser', props.user)
  store.commit('userDetailsPosition', position)
  store.commit('userDetailsIsVisible', true)
}

</script>

<template lang="pug">
.user-label-inline.badge(
  :key="props.user.id"
  :data-id="props.user.id"
  :style="{ background: props.user.color }"
  :class="{ 'button-badge': props.isClickable, 'bounce-up-down': shouldBounce }"
  @mouseup="toggleUserDetailsIsVisible"
  @touchend="toggleUserDetailsIsVisible"
  ref="labelElement"
  :title="props.title"
  @click.stop
)
  .user-avatar-inline(:class="{ 'is-on-dark-background': props.isOnDarkBackground }")
    template(v-if="props.user.isOnline")
      img.camera.anon-avatar(src="@/assets/camera.svg" title="Online")
    template(v-else)
      img.anon-avatar(src="@/assets/anon-avatar.svg" :class="{ 'is-dark': colorIsDark }")
  span.user-name(v-if="userHasName && !shouldHideName" :class="{ 'is-dark': colorIsDark }") {{ props.user.name }}
</template>

<style lang="stylus">
.user-label-inline
  display inline-block
  min-height initial
  padding 0 2px
  background var(--secondary-background)
  &.is-on-dark-background
    background var(--secondary-active-background)
  .user-avatar-inline
    width 4px
    margin-right 4px
    display inline-block
    .anon-avatar
      left 4px
      top 8px
      width 10.5px
    .camera
      top 7px
      width 11px
  .user-name
    margin-left 6px
    color var(--primary-on-light-background)
    &.is-dark
      color var(--primary-on-dark-background)

.button-badge
  .user-label-inline
    padding-bottom 0
    .anon-avatar
      top 6px

.bounce-up-down
  animation bounce-up-down 0.5s infinite ease-out alternate
@keyframes bounce-up-down
  0%
    transform translateY(-2px)
  100%
    transform translateY(2px)

</style>
