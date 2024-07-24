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
const downloadLocalJson = () => {
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

// json canvas
// https://jsoncanvas.org/spec/1.0/

const downloadLocalCanvas = () => {
  let space = utils.clone(currentSpace.value)
  delete space.clients
  const canvas = convertToCanvas(space)
  console.log('🧚 canvas to download', canvas)
  const json = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(canvas))
  const name = fileName()
  const downloadAnchor = document.getElementById('export-downlaod-anchor')
  downloadAnchor.setAttribute('href', json)
  downloadAnchor.setAttribute('download', `${name}.canvas`)
  downloadAnchor.click()
}
const convertToCanvas = (space) => {
  let canvas = {}
  canvas.nodes = []
  canvas.edges = []
  try {
    space.cards.forEach(card => {
      const node = {
        id: card.id,
        type: 'text',
        x: card.x,
        y: card.y,
        width: card.width,
        height: card.height,
        color: card.backgroundColor,
        text: card.name
      }
      canvas.nodes.push(node)
    })
    space.boxes.forEach(box => {
      const group = {
        id: box.id,
        type: 'group',
        x: box.x,
        y: box.y,
        width: box.resizeWidth,
        height: box.resizeHeight,
        color: box.color,
        label: box.name
      }
    })
    space.connections.forEach(connection => {
      const type = store.getters['currentConnections/typeByConnection'](connection)
      // direction
      let toEnd = 'none'
      if (connection.directionIsVisible) {
        toEnd = 'arrow'
      }
      // label
      let label
      if (connection.labelIsVisible) {
        label = type.name
      }
      const edge = {
        id: connection.id,
        fromNode: connection.startItemId,
        toNode: connection.endItemId,
        toEnd,
        color: type.color,
        label
      }
      canvas.edges.push(edge)
    })
    return canvas
  } catch (error) {
    console.error('🚒 convertToCanvas', error)
  }
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
      p Download Space
    .row
      .button-wrap(v-if="currentUserIsSignedIn")
        button(@click.left.stop="togglePdfIsVisible" :class="{ active: state.pdfIsVisible }")
          img.icon.file(src="@/assets/file.svg")
          span PDF
      .button-wrap
        button(@click.left="downloadLocalCanvas")
          img.icon.json-canvas(src="@/assets/json-canvas.svg")
          span Canvas

    Pdf(:visible="state.pdfIsVisible")
    .row
      .button-wrap
        button(@click.left="downloadLocalJson")
          img.icon.file(src="@/assets/file.svg")
          span Kinopio JSON

  section.export
    // anon user
    template(v-if="!currentUserIsSignedIn")
      p
        span Sign Up or In for more export options
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
    // signed in user
    template(v-if="currentUserIsSignedIn")
      p
        span Backup All (JSON and TXT)
      button(@click.left="downloadAllSpacesRemote" :class="{ active: state.isLoadingAllSpaces }")
        span Download All Spaces
        Loader(:visible="state.isLoadingAllSpaces")
    a#export-downlaod-anchor.hidden
    .info-container(v-if="state.isLoadingAllSpaces")
      .badge.info This will take a minute or so…
    .info-container(v-if="state.unknownServerError")
      .badge.danger (シ_ _)シ Something went wrong, Please try again or contact support
</template>

<style lang="stylus">
section.export
  max-width stretch
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
