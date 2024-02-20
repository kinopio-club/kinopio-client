<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
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
  :key="user.id"
  :data-id="user.id"
  :style="{ background: user.color }"
  :class="{ 'button-badge': isClickable }"
  @mouseup="toggleUserDetailsIsVisible"
  @touchend="toggleUserDetailsIsVisible"
  ref="labelElement"
  :title="title"
  @click.stop
)
  .user-avatar-inline(:class="{ 'is-on-dark-background': isOnDarkBackground }")
    img.anon-avatar(src="@/assets/anon-avatar.svg" :class="{ 'is-dark': colorIsDark }")
  span.user-name(v-if="userHasName && !shouldHideName" :class="{ 'is-dark': colorIsDark }") {{ user.name }}
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
</style>
