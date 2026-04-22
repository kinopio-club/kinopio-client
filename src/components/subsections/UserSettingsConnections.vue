<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import UserSettingsNewSpaceCards from '@/components/subsections/UserSettingsNewSpaceCards.vue'

import consts from '@/consts.js'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const customInputElement = ref(null)

const props = defineProps({
  visible: Boolean,
  parentIsUserSettings: Boolean
})

</script>

<template lang="pug">
.connections-settings(v-if="visible")
  //- shift-enter
  section
    .row
      span Shift-Enter
</template>

<style lang="stylus">
.connections-settings
  overflow auto
</style>
