<script setup>
import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const dialog = ref(null)

const props = defineProps({
  visible: Boolean,
  card: Object
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    scrollIntoView()
  }
})
const scrollIntoView = async () => {
  await nextTick()
  utils.scrollIntoView(dialog.value)
}

// copy url
const cardUrl = () => {
  return store.getters['currentSpace/cardUrl'](props.card)
}
const copyUrl = async (event) => {
  store.commit('clearNotificationsWithPosition')
  const position = utils.cursorPositionInPage(event)
  const url = cardUrl()
  try {
    console.log(url)
    await navigator.clipboard.writeText(url)
    store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}
</script>

<template lang="pug">
dialog.narrow.share-card(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p Share
  section
    section.subsection
      .row
        p Share With the World, or Paste in Another Space
      .row
        button(@click.left="copyUrl")
          img.icon.copy(src="@/assets/copy.svg")
          span Copy Public URL
</template>

<style lang="stylus">
</style>
