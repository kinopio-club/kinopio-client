<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import UserSettingsGeneral from '@/components/subsections/UserSettingsGeneral.vue'
import UserSettingsControls from '@/components/subsections/UserSettingsControls.vue'
import UserSettingsCards from '@/components/subsections/UserSettingsCards.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const visible = computed(() => globalStore.userSettingsIsVisible)
watch(() => visible.value, (value, prevValue) => {
  if (value) {
    closeChildDialogs()
    updateDialogHeight()
    restoreUserPrevSettingsSection()
    globalStore.shouldExplicitlyHideFooter = true
  } else {
    globalStore.shouldExplicitlyHideFooter = false
  }
})
const closeChildDialogs = () => {
  globalStore.triggerCloseChildDialogs()
}

const state = reactive({
  currentSettings: 'general' // general, controls
})

const updateDialogHeight = async () => {
  if (!visible.value) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

// current

const currentSettingsIsGeneral = computed(() => state.currentSettings === 'general')
const currentSettingsIsControls = computed(() => state.currentSettings === 'controls')
const currentSettingsIsCards = computed(() => state.currentSettings === 'cards')
const updateCurrentSettings = async (value) => {
  state.currentSettings = value
  await nextTick()
  updateDialogHeight()
  userStore.updateUser({ prevSettingsSection: value })
}
const restoreUserPrevSettingsSection = () => {
  const section = userStore.prevSettingsSection
  const values = ['general', 'controls', 'cards'] // listed in api docs
  const isValid = values.includes(section)
  if (section && isValid) {
    state.currentSettings = section
  } else {
    state.currentSettings = 'general'
  }
}

// pin

const userSettingsIsPinned = computed(() => { return globalStore.userSettingsIsPinned })
const toggleUserSettingsIsPinned = () => {
  closeChildDialogs()
  const value = !userSettingsIsPinned.value
  globalStore.userSettingsIsPinned = value
}

</script>

<template lang="pug">
dialog.user-settings.narrow.is-pinnable(v-if="visible" :open="visible" ref="dialogElement" @click.left.stop="closeChildDialogs" :style="{'max-height': state.dialogHeight + 'px'}" :data-is-pinned="userSettingsIsPinned" :class="{ 'is-pinned': userSettingsIsPinned, 'is-settings-overflow-auto': currentSettingsIsControls || currentSettingsIsCards }")
  section
    .row.title-row
      p
        //- img.icon.settings(src="@/assets/settings.svg")
        span Settings
      button.pin-button.small-button(:class="{active: userSettingsIsPinned}" @click.left="toggleUserSettingsIsPinned" title="Pin dialog")
        img.icon.pin(src="@/assets/pin.svg")

    .segmented-buttons
      button(@click="updateCurrentSettings('general')" :class="{ active: currentSettingsIsGeneral }")
        span General
      button(@click="updateCurrentSettings('controls')" :class="{ active: currentSettingsIsControls }")
        span Controls
      button(@click="updateCurrentSettings('cards')" :class="{ active: currentSettingsIsCards }")
        span Cards

  UserSettingsGeneral(:visible="currentSettingsIsGeneral")
  UserSettingsControls(:visible="currentSettingsIsControls")
  UserSettingsCards(:visible="currentSettingsIsCards")
</template>

<style lang="stylus">
dialog.user-settings
  left initial
  right 16px
  &.is-settings-overflow-auto
    overflow auto
  &.is-pinned
    left initial
    right 8px
  .pin-button
    margin 0
</style>
