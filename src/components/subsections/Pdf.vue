<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'

const store = useStore()

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  isLoading: false,
  unknownServerError: false
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    init()
  }
})
const init = () => {
  state.unknownServerError = false
  state.isLoading = false
  pdf()
}

const fileName = () => {
  const spaceName = store.state.currentSpace.name
  const spaceId = store.state.currentSpace.id
  let fileName = spaceName || `kinopio-space-${spaceId}`
  return fileName
}
const downloadBlob = (blob) => {
  try {
    const blobUrl = window.URL.createObjectURL(blob)
    const downloadAnchor = document.getElementById('pdf-downlaod-anchor')
    downloadAnchor.setAttribute('href', blobUrl)
    const name = fileName()
    downloadAnchor.setAttribute('download', `${name}.pdf`)
    downloadAnchor.click()
  } catch (error) {
    console.error('🚒 downloadBlob', error)
  }
}
const pdf = async () => {
  state.isLoading = true
  try {
    const url = await store.dispatch('api/pdf')
    const response = await fetch(url, { method: 'GET' })
    const blob = await response.blob()
    downloadBlob(blob)
  } catch (error) {
    console.error('🚒 pdf', error)
    state.unknownServerError = true
  }
  state.isLoading = false
}
</script>

<template lang="pug">
section.subsection.pdf(v-if="props.visible")
  a#pdf-downlaod-anchor.hidden
  template(v-if="state.isLoading")
    span
      Loader(:visible="true")
      span Creating space PDF…
  div(v-if="state.unknownServerError")
    .badge.danger
      span (シ_ _)シ Something went wrong, Please try again or contact support
  div(v-if="!state.isLoading && !state.unknownServerError")
    p.badge.success Downloaded
    p {{fileName()}}.pdf
</template>

<style lang="stylus">
section.pdf
  white-space initial
  margin-top 10px
  padding-bottom 4px
  .loader
    height 14px
    width 14px
    vertical-align 0px
    margin 0
    margin-right 6px
  .badge
    max-width stretch
    display block
    margin-top 0 !important
</style>
