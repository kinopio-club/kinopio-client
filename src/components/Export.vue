<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Pdf from '@/components/subsections/Pdf.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
const store = useStore()

const emit = defineEmits(['updateSpaces'])

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, async (value, prevValue) => {
  store.commit('clearNotificationsWithPosition')
  if (value) {
    state.pdfIsVisible = false
    state.spaceIsDuplicated = false
  }
})

const state = reactive({
  spaceIsDuplicated: false,
  dialogHeight: null,
  isLoadingAllSpaces: false,
  unknownServerError: false,
  pdfIsVisible: false
})

const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const currentSpace = computed(() => store.getters['currentSpace/all'])
const text = computed(() => utils.textFromCardNames(currentSpace.value.cards))

const fileName = () => {
  const spaceName = store.state.currentSpace.name
  const spaceId = store.state.currentSpace.id
  let fileName = spaceName || `kinopio-space-${spaceId}`
  return fileName
}
const copyText = async (event) => {
  store.commit('clearNotificationsWithPosition')
  const position = utils.cursorPositionInPage(event)
  try {
    await navigator.clipboard.writeText(text.value)
    store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}
const downloadLocalJSON = () => {
  let space = utils.clone(currentSpace.value)
  delete space.clients
  const json = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(space))
  const name = fileName()
  const downloadAnchor = document.getElementById('export-downlaod-anchor')
  downloadAnchor.setAttribute('href', json)
  downloadAnchor.setAttribute('download', `${name}.json`)
  downloadAnchor.click()
}
const downloadBlob = (blob, name) => {
  const blobUrl = window.URL.createObjectURL(blob)
  name = name || fileName()
  const downloadAnchor = document.getElementById('export-downlaod-anchor')
  downloadAnchor.setAttribute('href', blobUrl)
  downloadAnchor.setAttribute('download', `${name}.zip`)
  downloadAnchor.click()
}
const downloadAllSpacesRemote = async () => {
  if (state.isLoadingAllSpaces) { return }
  state.unknownServerError = false
  state.isLoadingAllSpaces = true
  try {
    const blob = await store.dispatch('api/downloadAllSpaces')
    downloadBlob(blob, 'kinopio-spaces')
  } catch (error) {
    console.error('🚒', error)
    state.unknownServerError = true
  }
  state.isLoadingAllSpaces = false
}
const duplicateSpace = () => {
  store.dispatch('currentSpace/duplicateSpace')
  state.spaceIsDuplicated = true
  emit('updateSpaces')
}
const triggerSignUpOrInIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerSignUpOrInIsVisible')
}
const togglePdfIsVisible = () => {
  const isVisible = state.pdfIsVisible
  state.pdfIsVisible = !isVisible
}

</script>

<template lang="pug">
template(v-if="visible")
  section.export
    .row
      button(@click.left="duplicateSpace")
        img.icon(src="@/assets/add.svg")
        span Duplicate this Space
    .row
      button(@click.left="copyText")
        img.icon.copy(src="@/assets/copy.svg")
        span Copy All Card Names
    .row(v-if="state.spaceIsDuplicated")
      span.badge.success Space copied

  section.export
    .row
      p Download
    .row
      .button-wrap(v-if="currentUserIsSignedIn")
        button(@click.left.stop="togglePdfIsVisible" :class="{ active: state.pdfIsVisible }")
          span PDF
      .button-wrap
        button(@click.left="downloadLocalJSON")
          span JSON
    Pdf(:visible="state.pdfIsVisible")

  section.export
    // anon user
    template(v-if="!currentUserIsSignedIn")
      p
        span Sign Up or In for more export options
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
    // signed in user
    template(v-if="currentUserIsSignedIn")
      p
        span Backup All
      button(@click.left="downloadAllSpacesRemote" :class="{ active: state.isLoadingAllSpaces }")
        span Download All Spaces (JSON and TXT)
        Loader(:visible="state.isLoadingAllSpaces")
    a#export-downlaod-anchor.hidden
    .info-container(v-if="state.isLoadingAllSpaces")
      .badge.info This will take a minute or so…
    .info-container(v-if="state.unknownServerError")
      .badge.danger (シ_ _)シ Something went wrong, Please try again or contact support
</template>

<style lang="stylus">
section.export
  textarea
    background-color var(--secondary-background)
    border 0
    border-radius var(--small-entity-radius)
    padding 4px
    margin-bottom 4px
    height 100px
  button
    display block
    margin-left 0
    white-space initial
  button + button
    margin-top 10px
  .badge.success
    margin-top 10px
  .hidden
    display none
  .info-container
    margin-top 10px
</style>
