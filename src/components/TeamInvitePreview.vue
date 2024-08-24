<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'
import TeamLabel from '@/components/TeamLabel.vue'
import utils from '@/utils.js'

const store = useStore()

onMounted(() => {
  console.log(`🐴 the component is now mounted.`, props.card, props.teamInviteUrl, props.selectedColor)
  updateTeam()
})

const props = defineProps({
  card: Object,
  teamInviteUrl: String,
  selectedColor: String
})
const state = reactive({
  isActive: null,
  team: {},
  isLoading: false
})

// url

const url = computed(() => {
  if (props.teamInviteUrl) {
    return props.teamInviteUrl
  }
  const urls = utils.urlsFromString(props.card.name)
  return urls.find(url => utils.urlIsTeamInvite(url))
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
  store.dispatch('currentSpace/changeSpace', props.otherSpace)
  store.dispatch('closeAllDialogs')
}

// colors

const isThemeDark = computed(() => store.getters['themes/isThemeDark'])
const background = computed(() => {
  let color = props.selectedColor || props.card.backgroundColor
  const defaultColor = utils.cssVariable('secondary-background')
  const colorIsDefaultColor = utils.colorsAreEqual(color, defaultColor)
  if (colorIsDefaultColor || !color) { return }
  return utils.alternateColor(color, isThemeDark.value)
})

const textColorClasses = computed(() => {
  const defaultColor = utils.cssVariable('secondary-background')
  let color
  color = background.value || defaultColor
  if (isThemeDark.value) {
    color = background.value || defaultColor
  }
  let classes = utils.textColorClasses({ backgroundColor: color })
  if (props.isImageCard) {
    classes.push('is-image-card')
  }
  return classes
})

// team info

const updateTeam = async () => {
  await nextTick()
  state.isLoading = true
  try {
    console.log('🏎️🏎️', props.card, props.teamInviteUrl, props.selectedColor)
  } catch (error) {
    console.error('🚒 updateTeam', error)
  }
}

</script>

<template lang="pug">
.team-invite-preview
  a.badge.link-badge.button-badge.badge-card-button(
    :title="url"
    :class="{ active: state.isActive, 'is-being-dragged': store.state.preventDraggedCardFromShowingDetails }"
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
        span Team Invite
      Loader(:visible="state.isLoading" :isSmall="true" :isStatic="true")
      //- TeamLabel(:team="state.team" :showName="true")
    .badge.danger.inline-badge
      span Keep Private
</template>

<style lang="stylus">
.team-invite-preview
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

</style>
