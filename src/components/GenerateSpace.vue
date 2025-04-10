<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'
import MinimapCanvas from '@/components/MinimapCanvas.vue'

import dayjs from 'dayjs'
import utils from '@/utils.js'
import consts from '@/consts.js'
import { nanoid } from 'nanoid'
import randomColor from 'randomcolor'

const store = useStore()

const rowElement = ref(null)
const textareaElement = ref(null)

const state = reactive({
  isGeneratingPreview: false,
  newSpace: null,
  size: null,
  pageWidth: null,
  pageHeight: null,
  errors: [],
  prompt: ''
})

const isOnline = computed(() => store.state.isOnline)

const promptInput = computed({
  get () {
    return state.prompt
  },
  set (newValue) {
    updatePrompt(newValue)
  }
})
const updatePrompt = (prompt) => {
  clear()
  textareaSize()
}
const textareaSize = () => {
  const textarea = textareaElement.value
  if (!textarea) { return }
  textarea.style.height = textarea.scrollHeight + 1 + 'px'
}

// > return the results of the following request in obsidian canvas json format:
// > Make me a space that maps out the pros and cons of moving to new york if you are trying to have a kid

// create a short title out of the prompt:
// Make me a space that maps out the pros and cons of moving to new york if you are trying to have a kid. The ids for each item should be a nanoid

const sample = {
  'nodes': [
    {
      'id': 'start',
      'type': 'text',
      'x': 0,
      'y': 0,
      'width': 300,
      'height': 50,
      'text': "Should you move to New York if you're trying to have a kid?"
    },
    {
      'id': 'pros',
      'type': 'text',
      'x': -400,
      'y': 200,
      'width': 200,
      'height': 50,
      'text': 'Pros'
    },
    {
      'id': 'cons',
      'type': 'text',
      'x': 400,
      'y': 200,
      'width': 200,
      'height': 50,
      'text': 'Cons'
    },
    {
      'id': 'pro1',
      'type': 'text',
      'x': -400,
      'y': 300,
      'width': 280,
      'height': 50,
      'text': 'Access to top hospitals and pediatric care'
    },
    {
      'id': 'pro2',
      'type': 'text',
      'x': -400,
      'y': 380,
      'width': 280,
      'height': 50,
      'text': 'Diverse education options (public, private, charter)'
    },
    {
      'id': 'pro3',
      'type': 'text',
      'x': -400,
      'y': 460,
      'width': 280,
      'height': 50,
      'text': 'Cultural exposure and enrichment opportunities'
    },
    {
      'id': 'pro4',
      'type': 'text',
      'x': -400,
      'y': 540,
      'width': 280,
      'height': 50,
      'text': 'Lots of family-friendly parks and activities'
    },
    {
      'id': 'con1',
      'type': 'text',
      'x': 400,
      'y': 300,
      'width': 280,
      'height': 50,
      'text': 'High cost of living (housing, childcare, etc.)'
    },
    {
      'id': 'con2',
      'type': 'text',
      'x': 400,
      'y': 380,
      'width': 280,
      'height': 50,
      'text': 'Limited space and small living areas'
    },
    {
      'id': 'con3',
      'type': 'text',
      'x': 400,
      'y': 460,
      'width': 280,
      'height': 50,
      'text': 'Busy, noisy environment can be stressful'
    },
    {
      'id': 'con4',
      'type': 'text',
      'x': 400,
      'y': 540,
      'width': 280,
      'height': 50,
      'text': 'Public school competition and zoning challenges'
    }
  ],
  'edges': [
    { 'fromNode': 'start', 'toNode': 'pros' },
    { 'fromNode': 'start', 'toNode': 'cons' },
    { 'fromNode': 'pros', 'toNode': 'pro1' },
    { 'fromNode': 'pros', 'toNode': 'pro2' },
    { 'fromNode': 'pros', 'toNode': 'pro3' },
    { 'fromNode': 'pros', 'toNode': 'pro4' },
    { 'fromNode': 'cons', 'toNode': 'con1' },
    { 'fromNode': 'cons', 'toNode': 'con2' },
    { 'fromNode': 'cons', 'toNode': 'con3' },
    { 'fromNode': 'cons', 'toNode': 'con4' }
  ]
}

const isValidCanvas = (space) => {
  state.errors = []
  const schema = {
    'nodes': 'array',
    'edges': 'array'
  }
  validateSchema(space, schema)
  if (state.errors.length) {
    throw new Error('🚒 isValid', space)
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

const newTypeColor = () => {
  const isThemeDark = store.state.currentUser.theme === 'dark'
  let color = randomColor({ luminosity: 'light' })
  if (isThemeDark) {
    color = randomColor({ luminosity: 'dark' })
  }
  return color
}

const normalizeSpace = async (space) => {
  const { cards, boxes, connectionTypes, connections } = space
  const spaceItems = await utils.uniqueSpaceItems({ cards, boxes, connectionTypes, connections }, true)
  space.cards = spaceItems.cards
  space.boxes = spaceItems.boxes
  space.connectionTypes = spaceItems.connectionTypes
  space.connections = spaceItems.connections
  return space
}

const updateSize = (space) => {
  const element = rowElement.value
  const rect = element.getBoundingClientRect()
  state.size = rect.width
  const pageSize = utils.pageSizeFromItems(space.cards)
  state.pageHeight = pageSize.height
  state.pageWidth = pageSize.width
}

const generatePreview = async () => {
  if (state.isGeneratingPreview) { return }
  try {
    state.isGeneratingPreview = true
    // TODO await call api w prompt and return canvasJson and spaceName
    isValidCanvas(sample)
    const typeColor = newTypeColor()
    let space = utils.convertFromJsonCanvas(sample, typeColor)
    space = await normalizeSpace(space)
    space.name = 'NYC Move with Kids: Pros & Cons Map' // TODO
    updateSize(space)
    state.newSpace = space
    console.log('🔮 generatePreview', space)
  } catch (error) {
    console.error('🚒 generatePreview', error)
  }
  state.isGeneratingPreview = false
}

const minimapCanvasIsVisible = computed(() => Boolean(state.newSpace))
const clear = () => {
  state.newSpace = null
  state.errors = []
}
const isError = computed(() => Boolean(state.errors.length))
</script>

<template lang="pug">
section.generate-space(v-if="isOnline")
  textarea(
    placeholder="Type to generate a space"
    v-model="promptInput"
    ref="textareaElement"
    @update="textareaSize"
    @keydown.enter.exact.prevent="generatePreview"
    @keyup.stop.backspace
    @keyup.stop.enter
    @mouseup.stop
    @touchend.stop
    rows="1"
    :maxlength="400"
  )
  button(:class="{active: state.isGeneratingPreview}" @click="generatePreview")
    img.icon.openai(src="@/assets/openai.svg")
    span Preview
    Loader(:visible="state.isGeneratingPreview")
  .badge.danger(v-if="isError") Something went wrong, please try again
  .minimap-canvas-inline-wrap(ref="rowElement")
    MinimapCanvas(
      :visible="minimapCanvasIsVisible"
      :space="state.newSpace"
      :size="state.size"
      :pageHeight="state.pageHeight"
      :pageWidth="state.pageWidth"
      :viewportIsHidden="true"
      )
    template(v-if="minimapCanvasIsVisible")
      button.cancel-minimap.small-button(title="Cancel" @click="clear")
        img.icon.cancel(src="@/assets/add.svg")
      button.add-space-button
        img.icon.add(src="@/assets/add.svg")
        span {{state.newSpace.name}}
</template>

<style lang="stylus">
.generate-space
  .minimap-canvas
    margin-top 10px
    border-bottom-left-radius 0
    border-bottom-right-radius 0
  .add-space-button
    margin-left 0
    border-top-left-radius 0
    border-top-right-radius 0
  .minimap-canvas-inline-wrap
    position relative
    .cancel-minimap
      position absolute
      top 6px
      right 6px
</style>
