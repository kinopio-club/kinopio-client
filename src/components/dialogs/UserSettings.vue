<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import UserSettingsGeneral from '@/components/subsections/UserSettingsGeneral.vue'
import UserSettingsControls from '@/components/subsections/UserSettingsControls.vue'
import UserSettingsCards from '@/components/subsections/UserSettingsCards.vue'
import utils from '@/utils.js'

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    }
  })
})

const visible = computed(() => store.state.userSettingsIsVisible)
watch(() => visible.value, (value, prevValue) => {
  if (value) {
    closeChildDialogs()
    updateDialogHeight()
    restoreUserPrevSettingsSection()
  }
})
const closeChildDialogs = () => {
  store.commit('triggerCloseChildDialogs')
}

const state = reactive({
  currentSettings: 'general' // general, controls
})

const updateDialogHeight = async () => {
  if (!visible.value) { return }
  await nextTick()
  let element = dialogElement.value
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
  store.dispatch('currentUser/update', { prevSettingsSection: value })
}
const restoreUserPrevSettingsSection = () => {
  const section = store.state.currentUser.prevSettingsSection
  const values = ['general', 'controls', 'cards'] // listed in api docs
  const isValid = values.includes(section)
  if (section && isValid) {
    state.currentSettings = section
  } else {
    state.currentSettings = 'general'
  }
}

// pin

const userSettingsIsPinned = computed(() => { return store.state.userSettingsIsPinned })
const toggleUserSettingsIsPinned = () => {
  closeChildDialogs()
  const value = !userSettingsIsPinned.value
  store.dispatch('userSettingsIsPinned', value)
}

</script>

<template lang="pug">
dialog.user-settings.narrow.is-pinnable(v-if="visible" :open="visible" ref="dialogElement" @click.left.stop="closeChildDialogs" :style="{'max-height': state.dialogHeight + 'px'}" :data-is-pinned="userSettingsIsPinned" :class="{ 'is-pinned': userSettingsIsPinned, 'is-settings-controls': currentSettingsIsControls }")
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
  &.is-settings-controls
    overflow auto
  &.is-pinned
    left initial
    right 8px
  .pin-button
    margin 0
</style>
