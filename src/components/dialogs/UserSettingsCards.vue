<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import UserSettingsCards from '@/components/subsections/UserSettingsCards.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const props = defineProps({
  visible: Boolean
})

</script>

<template lang="pug">
dialog.narrow.cards-settings-dialog(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement")
  UserSettingsCards(:visible="props.visible")
</template>

<style lang="stylus">
.cards-settings-dialog
  &.narrow
    width 200px
</style>
