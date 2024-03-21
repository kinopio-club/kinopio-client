<template lang="pug">
aside
  canvas#drop-guide-line.drop-guide-line
  canvas#remote-drop-guide-line.remote-drop-guide-line
</template>

<script>
import { nanoid } from 'nanoid'

let canvas, context, remoteCanvas, remoteContext, paintingGuidesTimer, remotePaintingGuidesTimer

let remoteDropGuideLines = []
const lineWidth = 100
const lineMaxHeight = 25
let controlPointEvenY = lineMaxHeight / 2
let controlPointOddY = lineMaxHeight / 2
const centerLineY = lineMaxHeight / 2
let isReverse = false

export default {
  name: 'DropGuideLine',
  props: {
    currentCursor: Object,
    currentCursorInSpace: Object,
    uploadIsDraggedOver: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerUpdateRemoteDropGuideLine') {
        let update = mutation.payload
        update.startPoint = this.updateRemotePosition(update.startPoint)
        update.curve = this.createCurve(update.startPoint)
        this.addRemoteCurve(update)
        this.remotePainting()
      }
      if (mutation.type === 'triggerUpdateStopRemoteUserDropGuideLine') {
        this.removeRemoteFramesByUser(mutation.payload.userId)
        remoteContext.clearRect(0, 0, remoteCanvas.width, remoteCanvas.height)
      }
    })
  },

  mounted () {
    canvas = document.getElementById('drop-guide-line')
    remoteCanvas = document.getElementById('remote-drop-guide-line')
    context = canvas.getContext('2d')
    remoteContext = remoteCanvas.getContext('2d')
    this.updateCanvasSize()
    window.addEventListener('load', this.updateCanvasSize)
    window.addEventListener('resize', this.updateCanvasSize)
  },
  beforeUnmount () {
    window.removeEventListener('load', this.updateCanvasSize)
    window.removeEventListener('resize', this.updateCanvasSize)
  },
  computed: {
    viewportWidth () { return this.$store.state.viewportWidth },
    viewportHeight () { return this.$store.state.viewportHeight },
    currentUserColor () { return this.$store.state.currentUser.color }
  },
  methods: {

    // curves

    updateRemotePosition (position) {
      const zoom = this.$store.getters.spaceZoomDecimal
      const space = document.getElementById('space')
      const rect = space.getBoundingClientRect()
      position = {
        x: (position.x * zoom) + rect.x,
        y: (position.y * zoom) + rect.y
      }
      return position
    },
    createCurve (startPoint) {
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
    },
    paintCurve (context, curve) {
      const { startPoint, controlPointEvenY, controlPointOddY, controlPointX1, endPointX1, controlPointX2, endPointX2, controlPointX3, endPointX3, controlPointX4, endPointX4, endPointY } = curve
      context.beginPath()
      context.moveTo(startPoint.x, startPoint.y)
      context.quadraticCurveTo(controlPointX1, controlPointOddY + startPoint.y, endPointX1, endPointY)
      context.quadraticCurveTo(controlPointX2, controlPointEvenY + startPoint.y, endPointX2, endPointY)
      context.quadraticCurveTo(controlPointX3, controlPointOddY + startPoint.y, endPointX3, endPointY)
      context.quadraticCurveTo(controlPointX4, controlPointEvenY + startPoint.y, endPointX4, endPointY)
      context.stroke()
    },

    // Remote Painting

    addRemoteCurve (curve) {
      remoteDropGuideLines.push(curve)
    },
    remotePainting () {
      if (!remotePaintingGuidesTimer) {
        remotePaintingGuidesTimer = window.requestAnimationFrame(this.remotePaintGuidesFrame)
      }
    },
    removeRemoteFrame (frameId) {
      remoteDropGuideLines = remoteDropGuideLines.filter(curve => {
        return curve.frameId !== frameId
      })
    },
    removeRemoteFramesByUser (userId) {
      remoteDropGuideLines = remoteDropGuideLines.filter(curve => {
        return curve.userId !== userId
      })
    },
    remotePaintGuidesFrame () {
      remoteContext.clearRect(0, 0, remoteCanvas.width, remoteCanvas.height)
      remoteDropGuideLines.forEach(guideLine => {
        this.removeRemoteFrame(guideLine.frameId)
        remoteContext.lineWidth = 4
        remoteContext.lineCap = 'round'
        remoteContext.strokeStyle = guideLine.color
        this.paintCurve(remoteContext, guideLine.curve)
      })
      if (remoteDropGuideLines.length > 0) {
        window.requestAnimationFrame(this.remotePaintGuidesFrame)
      } else {
        setTimeout(() => {
          window.cancelAnimationFrame(remotePaintingGuidesTimer)
          remotePaintingGuidesTimer = undefined
        }, 0)
      }
    },

    // Painting

    paintGuides () {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.strokeStyle = this.currentUserColor
      context.lineWidth = 4
      context.lineCap = 'round'
      // paint curve
      let startPoint = {
        x: this.currentCursor.x,
        y: this.currentCursor.y
      }
      let curve = this.createCurve(startPoint)
      this.paintCurve(context, curve)
      // broadcast curve
      const scroll = { x: window.scrollX, y: window.scrollY }
      startPoint = {
        x: this.currentCursor.x + scroll.x,
        y: this.currentCursor.y + scroll.y
      }
      this.broadcastCursorAndCurve({ startPoint, color: this.currentUserColor })
      if (paintingGuidesTimer) {
        window.requestAnimationFrame(this.paintGuides)
      } else {
        this.stopPaintingGuides()
      }
    },
    startPaintingGuides () {
      if (!paintingGuidesTimer) {
        paintingGuidesTimer = window.requestAnimationFrame(this.paintGuides)
      }
    },
    stopPaintingGuides () {
      window.cancelAnimationFrame(paintingGuidesTimer)
      paintingGuidesTimer = undefined
      context.clearRect(0, 0, canvas.width, canvas.height)
      this.broadcastStopPaintingGuide()
    },
    updateCanvasSize () {
      canvas.width = this.viewportWidth * window.devicePixelRatio
      canvas.height = this.viewportHeight * window.devicePixelRatio
      canvas.style.width = this.viewportWidth + 'px'
      canvas.style.height = this.viewportHeight + 'px'
      context.scale(window.devicePixelRatio, window.devicePixelRatio)
      remoteCanvas.width = this.viewportWidth * window.devicePixelRatio
      remoteCanvas.height = this.viewportHeight * window.devicePixelRatio
      remoteCanvas.style.width = this.viewportWidth + 'px'
      remoteCanvas.style.height = this.viewportHeight + 'px'
      remoteContext.scale(window.devicePixelRatio, window.devicePixelRatio)
    },
    broadcastCursorAndCurve ({ startPoint, color }) {
      const canEditSpace = this.$store.getters['currentUser/canEditSpace']()
      if (!canEditSpace) { return }
      let updates = {}
      updates.x = this.currentCursorInSpace.x
      updates.y = this.currentCursorInSpace.y
      updates.color = color
      updates.userId = this.$store.state.currentUser.id
      this.$store.commit('broadcast/update', { updates, type: 'updateRemoteUserCursor', handler: 'triggerUpdateRemoteUserCursor' })
      updates.startPoint = startPoint
      updates.color = color
      updates.frameId = window.crypto.randomUUID()
      this.$store.commit('broadcast/update', { updates, type: 'updateRemoteUserDropGuideLine', handler: 'triggerUpdateRemoteDropGuideLine' })
    },
    broadcastStopPaintingGuide () {
      const updates = { userId: this.$store.state.currentUser.id }
      this.$store.commit('broadcast/update', { updates, type: 'updateStopRemoteUserDropGuideLine', handler: 'triggerUpdateStopRemoteUserDropGuideLine' })
    }
  },
  watch: {
    uploadIsDraggedOver (value) {
      if (value) {
        this.startPaintingGuides()
      } else {
        this.stopPaintingGuides()
      }
    }
  }
}
</script>
<style lang="stylus" scoped>
canvas
  position fixed
  top 0
.drop-guide-line,
.remote-drop-guide-line
  pointer-events none
</style>
