<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'

import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useGlobalStore } from '@/stores/useGlobalStore'

import Loader from '@/components/Loader.vue'
import cache from '@/cache.js'
import utils from '@/utils.js'
import consts from '@/consts.js'

import { nanoid } from 'nanoid'
import randomColor from 'randomcolor'
import dayjs from 'dayjs'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const inputElement = ref(null)

const emit = defineEmits(['updateSpaces'])

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
  globalStore.closeAllDialogs()
  globalStore.importArenaChannelIsVisible = true
}

const newTypeColor = () => {
  const isThemeDark = userStore.theme === 'dark'
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
    nodes: 'array',
    edges: 'array'
  }
  validateSchema(space, schema)
  if (state.errors.length) {
    throw new Error('🚒 isValid')
  }
}
const isValidJson = (space) => {
  const schema = {
    name: 'string',
    users: 'array',
    cards: 'array',
    connections: 'array',
    connectionTypes: 'array',
    tags: 'array'
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
      const error = `Missing '${key}' field`
      state.errors.push(error)
    }
  })
}

// import

const importSpace = async (space) => {
  try {
    const user = userStore.getUserAllState
    globalStore.isLoadingSpace = true
    validate(space)
    if (state.format === 'canvas') {
      const typeColor = newTypeColor()
      space = utils.convertFromJsonCanvas(space, typeColor)
    }
    space = utils.resetSpaceMeta({ space, user, type: 'import' })
    space.connections = utils.migrationConnections(space.connections)
    const uniqueNewSpace = await cache.updateIdsInSpace(space)
    console.info('🧚 space to import', uniqueNewSpace)
    await spaceStore.saveImportSpace(uniqueNewSpace)
    updateSpaces()
    globalStore.triggerFocusSpaceDetailsName()
  } catch (error) {
    console.error('🚒', error)
    if (!state.errors.length) {
      state.unknownError = true
    }
  }
}
const updateSpaces = () => {
  emit('updateSpaces')
}
</script>

<template lang="pug">
template(v-if="visible")
  section.import
    //- iOS does not support '.canvas' in input accept
    input.hidden(type="file" ref="inputElement" accept="" @change="readFile")
    .row
      button(@click.left="selectFile('canvas')" :class="{active: isLoadingCanvas}")
        img.icon.json-canvas(src="@/assets/json-canvas.svg")
        span CANVAS File
        Loader(:visible="isLoadingCanvas")
    .row
      button(@click.left="selectFile('json')" :class="{active: isLoadingJson}")
        img.icon.file(src="@/assets/file.svg")
        span Kinopio JSON File
        Loader(:visible="isLoadingJson")

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
