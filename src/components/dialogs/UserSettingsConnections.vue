<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import UserSettingsConnections from '@/components/subsections/UserSettingsConnections.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const props = defineProps({
  visible: Boolean
})

const toggleUserSettings = () => {
  globalStore.closeAllDialogs()
  globalStore.userSettingsIsVisible = true
}
</script>

<template lang="pug">
dialog.narrow.user-settings-connections-dialog(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement")
  section.title-section.title-row
    span Connection Settings
    .button-wrap
      button.small-button(@click="toggleUserSettings")
        img.settings.icon(src="@/assets/settings.svg")
        span All
  UserSettingsConnections(:visible="props.visible")
</template>

<style lang="stylus">
.user-settings-connections-dialog
  left initial
  right 8px
  top 20px
  .title-section
    border-bottom 1px solid var(--primary-border)
</style>
