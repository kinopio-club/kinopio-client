<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useGroupStore } from '@/stores/useGroupStore'
import { useThemeStore } from '@/stores/useThemeStore'

import Loader from '@/components/Loader.vue'
import GroupLabel from '@/components/GroupLabel.vue'
import utils from '@/utils.js'

const store = useStore()
const groupStore = useGroupStore()
const themeStore = useThemeStore()

onMounted(() => {
  updateGroup()
})

const props = defineProps({
  card: Object,
  groupInviteUrl: String,
  selectedColor: String,
  parentIsCardDetails: Boolean
})
const state = reactive({
  isActive: null,
  group: {},
  isLoading: true
})

// url

const url = computed(() => {
  if (props.groupInviteUrl) {
    return props.groupInviteUrl
  }
  const urls = utils.urlsFromString(props.card.name)
  return urls.find(url => utils.urlIsGroupInvite(url))
})
const disableIsActive = () => {
  state.isActive = false
}
const enableIsActive = () => {
  state.isActive = true
}
const handleMouseEnterUrlButton = () => {
  store.commit('currentUserIsHoveringOverUrlButtonCardId', props.card.id)
}
const handleMouseLeaveUrlButton = () => {
  if (store.state.currentUserIsDraggingCard) { return }
  store.commit('currentUserIsHoveringOverUrlButtonCardId', '')
}
const openUrl = async (event) => {
  const prevIsActive = state.isActive
  state.isActive = false
  if (store.state.currentUserIsDraggingConnectionIdLabel) { return }
  if (store.state.preventDraggedCardFromShowingDetails) { return }
  if (event) {
    if (event.metaKey || event.ctrlKey) {
      window.open(url.value) // opens url in new tab
      store.commit('preventDraggedCardFromShowingDetails', true)
      return
    } else {
      event.preventDefault()
      event.stopPropagation()
    }
  }
  store.dispatch('closeAllDialogs')
  if (store.state.cardsWereDragged) {
    return
  }
  window.location = url.value
}

// colors

const isThemeDark = computed(() => themeStore.isThemeDark)
const background = computed(() => {
  const color = props.selectedColor || props.card.backgroundColor
  const defaultColor = utils.cssVariable('secondary-background')
  const colorIsDefaultColor = utils.colorsAreEqual(color, defaultColor)
  if (colorIsDefaultColor || !color) { return }
  return utils.alternateColor(color, isThemeDark.value)
})

const colorClasses = computed(() => {
  const defaultColor = utils.cssVariable('secondary-background')
  let color
  color = background.value || defaultColor
  if (isThemeDark.value) {
    color = background.value || defaultColor
  }
  const classes = utils.colorClasses({ backgroundColor: color })
  if (props.isImageCard) {
    classes.push('is-image-card')
  }
  return classes
})

// group info

const updateGroup = async () => {
  await nextTick()
  state.isLoading = true
  try {
    const groupFromUrl = utils.groupFromGroupInviteUrl(url.value)
    let group = groupStore.getGroup(groupFromUrl.id)
    if (group) {
      state.group = group
    } else {
      await groupStore.updateOtherGroups(groupFromUrl)
      group = groupStore.getGroup(groupFromUrl.id)
      state.group = group
    }
  } catch (error) {
    console.error('🚒 updateGroup', error)
  }
  state.isLoading = false
}

</script>

<template lang="pug">
.group-invite-preview
  a.badge.link-badge.button-badge.badge-card-button(
    :title="url"
    :class="{ active: state.isActive, 'is-being-dragged': store.state.preventDraggedCardFromShowingDetails, 'preview-content': props.parentIsCardDetails }"
    :style="{ background: background }"
    target="_blank"
    :href="url"
    @mouseenter="handleMouseEnterUrlButton"
    @mouseleave="handleMouseLeaveUrlButton"
    @mousedown.left="enableIsActive"
    @touchstart="enableIsActive"
    @click.stop.prevent
    @mouseup.left="openUrl($event)"
    @touchend.prevent="openUrl($event)"
  )
    .row
      .badge.info.inline-badge
        span Group Invite
    .row
      Loader(:visible="state.isLoading" :isSmall="true" :isStatic="true")
      template(v-if="!state.isLoading")
        GroupLabel(:group="state.group" :showName="true")
    .row
      .badge.danger Should not be shared publicly
</template>

<style lang="stylus">
.group-invite-preview
  text-decoration none
  margin 0
  &:hover
    .badge.info,
    .badge.danger
      span
        text-decoration none
  > .badge
    display block
    margin 0
  .inline-badge
    display inline-block
    margin-right 6px
  .badge.danger
    margin 0
  .preview-content
    padding var(--subsection-padding)
    pointer-events none
    .group-label
      pointer-events all
</style>
