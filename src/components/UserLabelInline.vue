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
  nameIsTruncated: Boolean,
  title: String,
  isOnDarkBackground: Boolean
})

// user

const userHasName = computed(() => Boolean(props.user.name))
const colorIsDark = computed(() => utils.colorIsDark(props.user.color))
const userName = computed(() => {
  let name = props.user.name
  if (props.nameIsTruncated) {
    name = utils.truncated(name, 15)
  }
  return name
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
  v-if="props.user"
  :key="props.user.id"
  :data-id="props.user.id"
  :style="{ background: props.user.color }"
  :class="{ 'button-badge': props.isClickable }"
  @mouseup="toggleUserDetailsIsVisible"
  @touchend="toggleUserDetailsIsVisible"
  ref="labelElement"
  :title="props.title"
  @click.stop
)
  img.anon-avatar(src="@/assets/anon-avatar.svg" :class="{ 'is-dark': colorIsDark, 'should-hide-name': shouldHideName }")
  img.icon.camera(v-if="props.user.isOnline" src="@/assets/camera.svg" title="Online" :class="{ 'is-dark': colorIsDark }")
  span.user-name(v-if="userHasName && !shouldHideName" :class="{ 'is-dark': colorIsDark }") {{ userName }}
</template>

<style lang="stylus">
.user-label-inline
  display inline-block
  min-height initial
  padding 0 2px
  background var(--secondary-background)
  .icon.camera,
  .anon-avatar
    display inline-block
    position static
  .icon.camera
    margin-left 6px
    vertical-align 1px
    filter none
    &.is-dark
      filter invert(1)
  .anon-avatar
    width 12px
    vertical-align 1px
    &.should-hide-name
      width 11px
      vertical-align 4px
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
