<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useUploadStore } from '@/stores/useUploadStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'

import utils from '@/utils.js'

import { nanoid } from 'nanoid'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const uploadStore = useUploadStore()
const broadcastStore = useBroadcastStore()

let canvas, context, remoteCanvas, remoteContext, paintingGuidesTimer, remotePaintingGuidesTimer

let remoteDropGuideLines = []
const lineWidth = 100
const lineMaxHeight = 25
let controlPointEvenY = lineMaxHeight / 2
let controlPointOddY = lineMaxHeight / 2
const centerLineY = lineMaxHeight / 2
let isReverse = false

let unsubscribes

onMounted(() => {
  canvas = document.getElementById('drop-guide-line')
  remoteCanvas = document.getElementById('remote-drop-guide-line')
  context = canvas.getContext('2d')
  remoteContext = remoteCanvas.getContext('2d')
  // drag over
  window.addEventListener('dragenter', checkIfUploadIsDraggedOver)
  window.addEventListener('dragover', checkIfUploadIsDraggedOver)
  window.addEventListener('dragleave', removeUploadIsDraggedOver)
  window.addEventListener('dragend', removeUploadIsDraggedOver)
  window.addEventListener('drop', addCardsAndUploadFiles)

  const globalStoreUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerUpdateRemoteDropGuideLine') {
        const update = args[0]
        update.startPoint = updateRemotePosition(update.startPoint)
        update.curve = createCurve(update.startPoint)
        addRemoteCurve(update)
        remotePainting()
      } else if (name === 'triggerUpdateStopRemoteUserDropGuideLine') {
        removeRemoteFramesByUser(args[0].userId)
        remoteContext.clearRect(0, 0, remoteCanvas.width, remoteCanvas.height)
      } else if (name === 'triggerUploadComplete') {
        removeUploadIsDraggedOver()
      }
    }
  )
  unsubscribes = () => {
    globalStoreUnsubscribe()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('dragenter', checkIfUploadIsDraggedOver)
  window.removeEventListener('dragover', checkIfUploadIsDraggedOver)
  window.removeEventListener('dragleave', removeUploadIsDraggedOver)
  window.removeEventListener('dragend', removeUploadIsDraggedOver)
  window.removeEventListener('drop', addCardsAndUploadFiles)
  unsubscribes()
})

const props = defineProps({
  viewportWidth: Number,
  viewportHeight: Number
})

const state = reactive({
  uploadIsDraggedOver: false,
  currentCursorInSpace: {}
})

const currentUserColor = computed(() => userStore.color)

// Upload Files

const checkIfUploadIsDraggedOver = (event) => {
  event.preventDefault()
  const uploadIsFiles = event.dataTransfer.types.find(type => type === 'Files')
  if (!event.dataTransfer) { return }
  if (!uploadIsFiles) { return }
  state.currentCursor = utils.cursorPositionInViewport(event)
  state.currentCursorInSpace = utils.cursorPositionInSpace(event)
  state.uploadIsDraggedOver = true
}
const removeUploadIsDraggedOver = () => {
  state.uploadIsDraggedOver = false
}
const addCardsAndUploadFiles = (event) => {
  event.preventDefault()
  event.stopPropagation()
  let files = event.dataTransfer.files
  files = Array.from(files)
  removeUploadIsDraggedOver()
  uploadStore.addCardsAndUploadFiles({
    files,
    event
  })
}

// curve

const createCurve = (startPoint) => {
  const numberOfControlPoints = 4
  const lineSegmentLength = lineWidth / numberOfControlPoints
  const lineSegmentIncrement = (lineSegmentLength / 2)
  if (controlPointEvenY <= lineMaxHeight && controlPointOddY >= 0 && !isReverse) {
    if (controlPointEvenY <= 0) {
      controlPointEvenY = 0
      isReverse = true
    }
    controlPointEvenY--
    controlPointOddY++
  } else {
    controlPointEvenY++
    controlPointOddY--
    if (controlPointEvenY >= lineMaxHeight) {
      controlPointEvenY = lineMaxHeight
      isReverse = false
    }
  }
  // 1
  const controlPointX1 = startPoint.x + lineSegmentIncrement
  const endPointX1 = startPoint.x + lineSegmentLength
  // 2
  const controlPointX2 = endPointX1 + lineSegmentIncrement
  const endPointX2 = startPoint.x + (lineSegmentLength * 2)
  // 3
  const controlPointX3 = endPointX2 + lineSegmentIncrement
  const endPointX3 = startPoint.x + (lineSegmentLength * 3)
  // 4
  const controlPointX4 = endPointX3 + lineSegmentIncrement
  const endPointX4 = startPoint.x + (lineSegmentLength * 4)
  // 5
  const endPointY = startPoint.y + centerLineY
  return { startPoint, controlPointEvenY, controlPointOddY, controlPointX1, endPointX1, controlPointX2, endPointX2, controlPointX3, endPointX3, controlPointX4, endPointX4, endPointY }
}
const paintCurve = (context, curve) => {
  const { startPoint, controlPointEvenY, controlPointOddY, controlPointX1, endPointX1, controlPointX2, endPointX2, controlPointX3, endPointX3, controlPointX4, endPointX4, endPointY } = curve
  context.beginPath()
  context.moveTo(startPoint.x, startPoint.y)
  context.quadraticCurveTo(controlPointX1, controlPointOddY + startPoint.y, endPointX1, endPointY)
  context.quadraticCurveTo(controlPointX2, controlPointEvenY + startPoint.y, endPointX2, endPointY)
  context.quadraticCurveTo(controlPointX3, controlPointOddY + startPoint.y, endPointX3, endPointY)
  context.quadraticCurveTo(controlPointX4, controlPointEvenY + startPoint.y, endPointX4, endPointY)
  context.stroke()
}

// Remote Painting

const updateRemotePosition = (position) => {
  const zoom = globalStore.spaceZoomDecimal
  const space = document.getElementById('space')
  const rect = space.getBoundingClientRect()
  position = {
    x: (position.x * zoom) + rect.x,
    y: (position.y * zoom) + rect.y
  }
  return position
}
const addRemoteCurve = (curve) => {
  remoteDropGuideLines.push(curve)
}
const remotePainting = () => {
  if (!remotePaintingGuidesTimer) {
    remotePaintingGuidesTimer = window.requestAnimationFrame(remotePaintGuidesFrame)
  }
}
const removeRemoteFrame = (frameId) => {
  remoteDropGuideLines = remoteDropGuideLines.filter(curve => {
    return curve.frameId !== frameId
  })
}
const removeRemoteFramesByUser = (userId) => {
  remoteDropGuideLines = remoteDropGuideLines.filter(curve => {
    return curve.userId !== userId
  })
}
const remotePaintGuidesFrame = () => {
  remoteContext.clearRect(0, 0, remoteCanvas.width, remoteCanvas.height)
  remoteDropGuideLines.forEach(guideLine => {
    removeRemoteFrame(guideLine.frameId)
    remoteContext.lineWidth = 4
    remoteContext.lineCap = 'round'
    remoteContext.strokeStyle = guideLine.color
    paintCurve(remoteContext, guideLine.curve)
  })
  if (remoteDropGuideLines.length > 0) {
    window.requestAnimationFrame(remotePaintGuidesFrame)
  } else {
    setTimeout(() => {
      window.cancelAnimationFrame(remotePaintingGuidesTimer)
      remotePaintingGuidesTimer = undefined
    }, 0)
  }
}

// Painting

watch(() => state.uploadIsDraggedOver, (value, prevValue) => {
  if (value) {
    startPaintingGuides()
  } else {
    stopPaintingGuides()
  }
})
const paintGuides = () => {
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = currentUserColor.value
  context.lineWidth = 4
  context.lineCap = 'round'
  // paint curve
  let startPoint = {
    x: state.currentCursor.x,
    y: state.currentCursor.y
  }
  const curve = createCurve(startPoint)
  paintCurve(context, curve)
  // broadcast curve
  const scroll = { x: window.scrollX, y: window.scrollY }
  startPoint = {
    x: state.currentCursor.x + scroll.x,
    y: state.currentCursor.y + scroll.y
  }
  broadcastCursorAndCurve({ startPoint, color: currentUserColor.value })
  if (paintingGuidesTimer) {
    window.requestAnimationFrame(paintGuides)
  } else {
    stopPaintingGuides()
  }
}
const startPaintingGuides = () => {
  if (!paintingGuidesTimer) {
    paintingGuidesTimer = window.requestAnimationFrame(paintGuides)
  }
}
const stopPaintingGuides = () => {
  window.cancelAnimationFrame(paintingGuidesTimer)
  paintingGuidesTimer = undefined
  context.clearRect(0, 0, canvas.width, canvas.height)
  broadcastStopPaintingGuide()
}
const broadcastCursorAndCurve = ({ startPoint, color }) => {
  const canEditSpace = userStore.getUserCanEditSpace
  if (!canEditSpace) { return }
  const updates = {}
  updates.x = state.currentCursorInSpace.x
  updates.y = state.currentCursorInSpace.y
  updates.color = color
  updates.userId = userStore.id
  broadcastStore.update({ updates, type: 'updateRemoteUserCursor', handler: 'triggerUpdateRemoteUserCursor' })
  updates.startPoint = startPoint
  updates.color = color
  updates.frameId = nanoid()
  broadcastStore.update({ updates, type: 'updateRemoteUserDropGuideLine', handler: 'triggerUpdateRemoteDropGuideLine' })
}
const broadcastStopPaintingGuide = () => {
  const updates = { userId: userStore.id }
  broadcastStore.update({ updates, type: 'updateStopRemoteUserDropGuideLine', handler: 'triggerUpdateStopRemoteUserDropGuideLine' })
}

const isMobile = computed(() => utils.isMobile())

</script>

<template lang="pug">
template(v-if="!isMobile")
  canvas#drop-guide-line.drop-guide-line(
    :width="props.viewportWidth"
    :height="props.viewportHeight"
  )
  canvas#remote-drop-guide-line.remote-drop-guide-line(
    :width="props.viewportWidth"
    :height="props.viewportHeight"
  )
</template>

<style lang="stylus" scoped>
canvas
  position fixed
  top 0
.drop-guide-line,
.remote-drop-guide-line
  pointer-events none
</style>
