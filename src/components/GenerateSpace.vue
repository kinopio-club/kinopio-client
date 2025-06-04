<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import Loader from '@/components/Loader.vue'
import MinimapCanvas from '@/components/MinimapCanvas.vue'
import backgroundImagesJSON from '@/data/backgroundImages.json'

import dayjs from 'dayjs'
import utils from '@/utils.js'
import consts from '@/consts.js'
import { nanoid } from 'nanoid'
import randomColor from 'randomcolor'
import sample from 'lodash-es/sample'

const store = useStore()
const connectionStore = useConnectionStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const rowElement = ref(null)
const textareaElement = ref(null)

const state = reactive({
  isGeneratingPreview: false,
  isLoadingSpace: false,
  newSpace: null,
  size: null,
  pageWidth: null,
  pageHeight: null,
  errors: [],
  prompt: '',
  backgroundPreview: '',
  background: ''
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
  state.prompt = prompt
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

// const sample = { 'nodes': [{ 'id': 'node1', 'type': 'text', 'x': 0, 'y': 0, 'width': 400, 'height': 60, 'text': 'Moving to New York with Plans for Having a Child' }, { 'id': 'node2', 'type': 'text', 'x': -500, 'y': 100, 'width': 350, 'height': 60, 'text': 'PROS' }, { 'id': 'node3', 'type': 'text', 'x': 150, 'y': 100, 'width': 350, 'height': 60, 'text': 'CONS' }, { 'id': 'node4', 'type': 'text', 'x': -500, 'y': 200, 'width': 350, 'height': 80, 'text': 'Excellent Healthcare Options\n- Top-rated hospitals and specialists\n- Advanced fertility treatments available' }, { 'id': 'node5', 'type': 'text', 'x': -500, 'y': 300, 'width': 350, 'height': 80, 'text': 'Educational Opportunities\n- Diverse school options (public, private, charter)\n- Specialized programs and magnet schools' }, { 'id': 'node6', 'type': 'text', 'x': -500, 'y': 400, 'width': 350, 'height': 80, 'text': 'Cultural Exposure\n- Museums, theaters, diverse communities\n- Rich multicultural environment for child development' }, { 'id': 'node7', 'type': 'text', 'x': -500, 'y': 500, 'width': 350, 'height': 80, 'text': 'Family Support Services\n- Abundant childcare options\n- Parenting groups and community resources' }, { 'id': 'node8', 'type': 'text', 'x': -500, 'y': 600, 'width': 350, 'height': 80, 'text': 'Public Transportation\n- Less reliance on cars\n- Accessibility to family-friendly destinations' }, { 'id': 'node9', 'type': 'text', 'x': 150, 'y': 200, 'width': 350, 'height': 80, 'text': 'High Cost of Living\n- Expensive housing market\n- Childcare costs among highest in nation' }, { 'id': 'node10', 'type': 'text', 'x': 150, 'y': 300, 'width': 350, 'height': 80, 'text': 'Space Limitations\n- Smaller living spaces\n- Limited outdoor play areas in many neighborhoods' }, { 'id': 'node11', 'type': 'text', 'x': 150, 'y': 400, 'width': 350, 'height': 80, 'text': 'School Competition\n- Competitive admission processes\n- Overcrowding in desirable public schools' }, { 'id': 'node12', 'type': 'text', 'x': 150, 'y': 500, 'width': 350, 'height': 80, 'text': 'Work-Life Balance Challenges\n- Long commutes\n- Fast-paced lifestyle can limit family time' }, { 'id': 'node13', 'type': 'text', 'x': 150, 'y': 600, 'width': 350, 'height': 80, 'text': 'Environmental Factors\n- Air quality concerns\n- Noise pollution\n- Urban stressors' }, { 'id': 'node14', 'type': 'text', 'x': -175, 'y': 700, 'width': 350, 'height': 100, 'text': 'Key Considerations:\n- Financial readiness\n- Support network\n- Career opportunities\n- Neighborhood selection\n- Long-term family goals' }],
// 'edges': [{ 'id': 'edge1', 'fromNode': 'node1', 'toNode': 'node2', 'label': 'benefits' },
// { 'id': 'edge2', 'fromNode': 'node1', 'toNode': 'node3', 'label': 'challenges' }, { 'id': 'edge3', 'fromNode': 'node2', 'toNode': 'node4', 'label': '' }, { 'id': 'edge4', 'fromNode': 'node2', 'toNode': 'node5', 'label': '' }, { 'id': 'edge5', 'fromNode': 'node2', 'toNode': 'node6', 'label': '' }, { 'id': 'edge6', 'fromNode': 'node2', 'toNode': 'node7', 'label': '' }, { 'id': 'edge7', 'fromNode': 'node2', 'toNode': 'node8', 'label': '' }, { 'id': 'edge8', 'fromNode': 'node3', 'toNode': 'node9', 'label': '' }, { 'id': 'edge9', 'fromNode': 'node3', 'toNode': 'node10', 'label': '' }, { 'id': 'edge10', 'fromNode': 'node3', 'toNode': 'node11', 'label': '' }, { 'id': 'edge11', 'fromNode': 'node3', 'toNode': 'node12', 'label': '' }, { 'id': 'edge12', 'fromNode': 'node3', 'toNode': 'node13', 'label': '' }, { 'id': 'edge13', 'fromNode': 'node1', 'toNode': 'node14', 'label': 'requires' }] }

const isValidCanvas = (space) => {
  state.errors = []
  const schema = {
    nodes: 'array',
    edges: 'array'
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
      const error = `Missing '${key}' field`
      state.errors.push(error)
    }
  })
}

const newTypeColor = () => {
  const isThemeDark = userStore.theme === 'dark'
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

// background color

const isThemeDark = computed(() => userStore.theme === 'dark')
const updateBackground = () => {
  let images = backgroundImagesJSON
  images = images.filter(image => !image.isArchived || !image.shouldSkipInGenerateSpace)
  const image = sample(images)
  let url = image.url
  if (isThemeDark.value) {
    url = image.darkUrl || url
  }
  state.backgroundPreview = image.previewUrl || url
  state.background = url
}

const connectionPaths = (space) => {
  space.connections = space.connections.map(connection => {
    const { controlPoint, endItemId, startItemId } = connection
    const widthOffset = consts.normalCardMaxWidth - 16
    const heightOffset = 16
    // cards
    const startItem = structuredClone(space.cards.find(card => card.id === startItemId))
    const endItem = structuredClone(space.cards.find(card => card.id === endItemId))
    // x offset
    startItem.x += widthOffset
    endItem.x += widthOffset
    // y offset
    startItem.y += heightOffset
    endItem.y += heightOffset
    // calc path
    connection.path = connectionStore.getConnectionPathBetweenCoords(startItem, endItem, controlPoint)
    return connection
  })
  return space
}

const generatePreview = async () => {
  updateBackground()
  if (!state.prompt) { return }
  if (state.isGeneratingPreview) { return }
  try {
    clear()
    state.isGeneratingPreview = true
    const { data, name } = await store.dispatch('api/generateSpace', state.prompt)
    isValidCanvas(data)
    const typeColor = newTypeColor()
    let space = utils.convertFromJsonCanvas(data, typeColor)
    space = await normalizeSpace(space)
    space.name = name
    space.background = state.background
    updateSize(space)
    space = connectionPaths(space)
    console.log('🔮 generatePreview', space)
    state.newSpace = space
  } catch (error) {
    console.error('🚒 generatePreview', error)
    state.errors.push('generatePreview')
  }
  state.isGeneratingPreview = false
}

const minimapCanvasIsVisible = computed(() => Boolean(state.newSpace))
watch(() => minimapCanvasIsVisible.value, (value, prevValue) => {
  if (value) {
    textareaSize()
  }
})
const clear = () => {
  state.newSpace = null
  state.errors = []
}
const isError = computed(() => Boolean(state.errors.length))

const importSpace = async () => {
  if (state.isLoadingSpace) { return }
  try {
    state.isLoadingSpace = true
    let space = utils.clone(state.newSpace)
    const user = userStore.getUserAllState
    space = utils.resetSpaceMeta({ space, user })
    console.info('🧚 space to import', space)
    await spaceStore.saveSpace(space)
    await spaceStore.loadSpace(space)
    store.dispatch('closeAllDialogs')
  } catch (error) {
    console.error('🚒 importSpace', error, state.newSpace)
  }
  state.isLoadingSpace = true
}
</script>

<template lang="pug">
section.generate-space(v-if="isOnline")
  template(v-if="!minimapCanvasIsVisible")
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
      :maxlength="1000"
    )
    .row.button-row
      button(:class="{ active: state.isGeneratingPreview }" @click="generatePreview")
        img.icon.luck(src="@/assets/luck.svg")
        span Preview
        Loader(:visible="state.isGeneratingPreview")
      .badge.info(v-if="state.isGeneratingPreview") takes 15s
    .badge.danger(v-if="isError") Something went wrong, please try again
  .minimap-canvas-inline-wrap(ref="rowElement" :style="{ backgroundImage: `url(${state.backgroundPreview})` }")
    MinimapCanvas(
      :visible="minimapCanvasIsVisible"
      :space="state.newSpace"
      :size="state.size"
      :pageHeight="state.pageHeight"
      :pageWidth="state.pageWidth"
      :viewportIsHidden="true"
      backgroundColor="transparent"
    )
    template(v-if="minimapCanvasIsVisible")
      button.cancel-minimap.small-button(title="Cancel" @click="clear")
        img.icon.cancel(src="@/assets/add.svg")
      button.add-space-button(@click="importSpace" :class="{ active: state.isLoadingSpace }")
        img.icon.add(src="@/assets/add.svg")
        span {{state.newSpace.name}}
        Loader(:visible="state.isLoadingSpace")
</template>

<style lang="stylus">
.generate-space
  .add-space-button
    margin-left 0
    border-top-left-radius 0
    border-top-right-radius 0
    width 100%
  .minimap-canvas-inline-wrap
    border-radius var(--entity-radius)
    position relative
    .cancel-minimap
      position absolute
      top 6px
      right 6px
  .button-row
    margin-bottom 0 !important
    .badge
      margin-left 6px
      margin-right 0
  .icon.luck
    vertical-align -1px
</style>
