<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'
import cache from '@/cache.js'
import utils from '@/utils.js'
import consts from '@/consts.js'

import { nanoid } from 'nanoid'
import randomColor from 'randomcolor'

const store = useStore()

const inputElement = ref(null)

const emit = defineEmits(['updateSpaces', 'closeDialog'])

const props = defineProps({
  visible: Boolean
})

const state = reactive({
  loading: false,
  errors: [],
  unknownError: false,
  format: ''
})

const isLoadingJson = computed(() => state.loading && state.format === 'json')
const isLoadingCanvas = computed(() => state.loading && state.format === 'canvas')

const toggleImportArenaChannelIsVisible = () => {
  store.commit('closeAllDialogs')
  store.commit('importArenaChannelIsVisible', true)
}

const newTypeColor = () => {
  const isThemeDark = store.state.currentUser.theme === 'dark'
  let color = randomColor({ luminosity: 'light' })
  if (isThemeDark) {
    color = randomColor({ luminosity: 'dark' })
  }
  return color
}

// file input

const selectFile = (format) => {
  if (state.loading) { return }
  state.format = format
  const input = inputElement.value
  input.click()
  state.unknownError = false
}
const readFile = () => {
  state.loading = true
  const input = inputElement.value
  const file = input.files[0]
  const reader = new FileReader()
  reader.readAsText(file)
  reader.onload = event => {
    state.loading = false
    let space
    try {
      space = JSON.parse(event.target.result)
    } catch (error) {
      console.error('🚒', error)
      state.unknownError = true
    }
    importSpace(space)
  }
}

// validation

const validate = (space) => {
  state.errors = []
  if (state.format === 'canvas') {
    isValidCanvas(space)
  } else {
    isValidJson(space)
  }
}
const isValidCanvas = (space) => {
  const schema = {
    'nodes': 'array',
    'edges': 'array'
  }
  validateSchema(space, schema)
  if (state.errors.length) {
    throw new Error('🚒 isValid')
  }
}
const isValidJson = (space) => {
  const schema = {
    'name': 'string',
    'users': 'array',
    'cards': 'array',
    'connections': 'array',
    'connectionTypes': 'array',
    'tags': 'array'
  }
  validateSchema(space, schema)
  if (state.errors.length) {
    throw new Error('🚒 validate')
  }
}
const validateSchema = (space, schema) => {
  const keys = Object.keys(schema)
  keys.forEach(key => {
    const isValidType = utils.typeCheck({ value: space[key], type: schema[key], origin: 'isValidJson' })
    if (!isValidType) {
      let error = `Missing '${key}' field`
      state.errors.push(error)
    }
  })
}

// convert json canvas
// https://jsoncanvas.org

const convertFromCanvas = (space) => {
  const yThreshold = 150
  let newSpace = {}
  try {
    newSpace.name = `Canvas ${utils.journalSpaceName({})}`
    newSpace.id = nanoid()
    newSpace.background = consts.defaultSpaceBackground
    newSpace.cards = []
    newSpace.connections = []
    newSpace.connectionTypes = []
    const shouldNudgeCardsY = space.nodes.filter(node => node.y <= yThreshold)
    space.nodes.forEach(node => {
      // url
      let shouldUpdateUrlPreview
      if (node.url) {
        shouldUpdateUrlPreview = true
      }
      // y
      let y = node.y
      if (shouldNudgeCardsY) {
        y += yThreshold
      }
      // name
      let name = node.text || node.url || node.label
      if (node.file) {
        name = `\`${node.file}\``
      }
      const newCard = {
        id: node.id,
        x: node.x,
        y,
        backgroundColor: node.canvasColor || node.color,
        name,
        shouldUpdateUrlPreview
      }
      newSpace.cards.push(newCard)
    })
    space.edges.forEach((edge, index) => {
      const typeId = window.crypto.randomUUID()
      const newConnection = {
        id: edge.id,
        startCardId: edge.fromNode,
        endCardId: edge.toNode,
        controlPoint: `q00,00`, // straight line
        directionIsVisible: Boolean(edge.fromEnd === 'arrow' || edge.toEnd === 'arrow'),
        connectionTypeId: typeId,
        labelIsVisible: Boolean(edge.label)
      }
      const newConnetionType = {
        id: typeId,
        color: edge.canvasColor || edge.color || newTypeColor(),
        name: edge.label || `Connection Type ${index}`
      }
      newSpace.connections.push(newConnection)
      newSpace.connectionTypes.push(newConnetionType)
    })
    return newSpace
  } catch (error) {
    console.error('🚒 convertFromCanvas', error)
  }
}

// import

const importSpace = async (space) => {
  try {
    const currentUserId = store.state.currentUser.id
    validate(space)
    if (state.format === 'canvas') {
      space = convertFromCanvas(space)
    }
    space = utils.clearSpaceMeta(space, 'import')
    space = utils.spaceItemUsersToCurrentUser(space, currentUserId)
    space.userId = currentUserId
    const uniqueNewSpace = cache.updateIdsInSpace(space)
    console.log('🧚 space to import', uniqueNewSpace)
    await store.dispatch('currentSpace/saveSpace', uniqueNewSpace)
    await store.dispatch('currentSpace/loadSpace', { space: uniqueNewSpace })
    store.dispatch('currentCards/updateDimensions', { cards: uniqueNewSpace.cards })
    store.dispatch('currentConnections/correctPaths', { shouldUpdateApi: true })
    updateSpaces()
    store.commit('triggerFocusSpaceDetailsName')
  } catch (error) {
    console.error('🚒', error)
    if (!state.errors.length) {
      state.unknownError = true
    }
  }
}
const updateSpaces = () => {
  emit('updateSpaces')
  emit('closeDialog')
}
</script>

<template lang="pug">
template(v-if="visible")
  section.import
    input.hidden(type="file" ref="inputElement" accept=".json, .canvas" @change="readFile")
    .row
      button(@click.left="selectFile('json')" :class="{active: isLoadingJson}")
        img.icon.file(src="@/assets/file.svg")
        span Kinopio JSON File
        Loader(:visible="isLoadingJson")
    .row
      button(@click.left="selectFile('canvas')" :class="{active: isLoadingCanvas}")
        img.icon.json-canvas(src="@/assets/json-canvas.svg")
        span CANVAS File
        Loader(:visible="isLoadingCanvas")

    .row(v-if="state.unknownError")
      .badge.danger (シ_ _)シ Something went wrong parsing your file
    .row(v-if="state.errors.length")
      span.badge.danger
        p File Validation Errors:
        ul
          li(v-for="(error in state.errors") {{error}}

  section.import
    .row
      .button-wrap(@click.stop)
        button(@click.left.stop="toggleImportArenaChannelIsVisible")
          img.icon.arena(src="@/assets/arena.svg")
          span Are.na Channel
</template>

<style lang="stylus">
section.import
  .hidden
    display none
  .loader
    margin-left 6px
  ul
    margin 0
    padding 8px
    padding-left 10px
    li
      padding-top 10px
      margin-left 5px
      user-select text
      &:first-child
        padding-top 0
  ul
    list-style-type square
  .row
    align-items baseline
</style>
