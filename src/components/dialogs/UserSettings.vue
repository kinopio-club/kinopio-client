<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import UserSettingsGeneral from '@/components/UserSettingsGeneral.vue'
const store = useStore()

const dialogElement = ref(null)

const visible = computed(() => store.state.userSettingsIsVisible)
watch(() => visible.value, (value, prevValue) => {
  if (value) {
    closeChildDialogs()
  }
})
const closeChildDialogs = () => {
  store.commit('triggerCloseChildDialogs')
}

const state = reactive({
  currentSettings: 'general' // general, controls
})
const currentSettingsIsGeneral = computed(() => state.currentSettings === 'general')
const currentSettingsIsControls = computed(() => state.currentSettings === 'controls')
const updateCurrentSettings = (value) => {
  state.currentSettings = value
}
</script>

<template lang="pug">
dialog.user-settings.narrow(v-if="visible" :open="visible" ref="dialogElement" @click.left.stop="closeChildDialogs")
  section
    p
      img.icon.settings(src="@/assets/settings.svg")
      span User Settings
    .segmented-buttons
      button(@click="updateCurrentSettings('general')" :class="{ active: currentSettingsIsGeneral }")
        span General
      button(@click="updateCurrentSettings('controls')" :class="{ active: currentSettingsIsControls }")
        span Controls
  UserSettingsGeneral(:visible="currentSettingsIsGeneral")
</template>

<style lang="stylus">
dialog.user-settings
  left initial
  right 16px
</style>
