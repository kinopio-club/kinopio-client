<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

let unsubscribes

const dialogElement = ref(null)

const props = defineProps({
  visible: Boolean,
  value: String
})

const themeName = computed(() => userStore.theme)
</script>

<template lang="pug">
dialog.narrow.qr-code(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement")
  section.title-section
    p QR Code
  section
    p {{props.value}}
</template>

<style lang="stylus">
dialog.qr-code
  p
    word-break break-word
</style>
