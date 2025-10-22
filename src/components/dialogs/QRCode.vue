<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import utils from '@/utils.js'

import { generate, correction } from 'lean-qr/nano'

const globalStore = useGlobalStore()

const dialogElement = ref(null)
const qrElement = ref(null)

const props = defineProps({
  visible: Boolean,
  value: String
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateQR()
  }
})

const updateQR = async () => {
  await nextTick()
  const code = generate(props.value)
  code.toCanvas(qrElement.value, {
    pad: 1
  })
}

</script>

<template lang="pug">
dialog.narrow.qr-code(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement")
  section.title-section
    p Scan QR Code
  section
    canvas#qr(ref="qrElement")
</template>

<style lang="stylus">
dialog.qr-code
  p
    word-break break-word
  canvas
    width 200px
    height 200px
    image-rendering: pixelated
    background-color var(--primary-on-dark-background)
</style>
