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
        let curve = mutation.payload
        this.addRemoteCurve(curve)
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
        const { remoteControlPointEvenY, remoteControlPointOddY, startPointX, startPointY, controlPointX1, endPointX1, controlPointX2, endPointX2, controlPointX3, endPointX3, controlPointX4, endPointX4, endPointY } = guideLine.curve
        remoteContext.lineWidth = 4
        remoteContext.lineCap = 'round'
        remoteContext.strokeStyle = guideLine.color
        remoteContext.beginPath()
        remoteContext.moveTo(startPointX, startPointY)
        remoteContext.quadraticCurveTo(controlPointX1, remoteControlPointOddY + startPointY, endPointX1, endPointY)
        remoteContext.quadraticCurveTo(controlPointX2, remoteControlPointEvenY + startPointY, endPointX2, endPointY)
        remoteContext.quadraticCurveTo(controlPointX3, remoteControlPointOddY + startPointY, endPointX3, endPointY)
        remoteContext.quadraticCurveTo(controlPointX4, remoteControlPointEvenY + startPointY, endPointX4, endPointY)
        remoteContext.stroke()
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

      const numberOfControlPoints = 4
      const lineSegmentLength = lineWidth / numberOfControlPoints
      const lineSegmentIncrement = (lineSegmentLength / 2)
      const currentCursor = {
        x: this.currentCursor.x,
        y: this.currentCursor.y
      }

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

      // 0
      const startPointX = currentCursor.x
      const startPointY = currentCursor.y
      // 1
      const controlPointX1 = startPointX + lineSegmentIncrement
      const endPointX1 = startPointX + lineSegmentLength
      // 2
      const controlPointX2 = endPointX1 + lineSegmentIncrement
      const endPointX2 = startPointX + (lineSegmentLength * 2)
      // 3
      const controlPointX3 = endPointX2 + lineSegmentIncrement
      const endPointX3 = startPointX + (lineSegmentLength * 3)
      // 4
      const controlPointX4 = endPointX3 + lineSegmentIncrement
      const endPointX4 = startPointX + (lineSegmentLength * 4)
      // 5
      const endPointY = startPointY + centerLineY

      context.beginPath()
      context.moveTo(startPointX, startPointY)
      // quadraticCurveTo(controlPointX, controlPointY, endPointX, endPointY)
      context.quadraticCurveTo(controlPointX1, controlPointOddY + startPointY, endPointX1, endPointY)
      context.quadraticCurveTo(controlPointX2, controlPointEvenY + startPointY, endPointX2, endPointY)
      context.quadraticCurveTo(controlPointX3, controlPointOddY + startPointY, endPointX3, endPointY)
      context.quadraticCurveTo(controlPointX4, controlPointEvenY + startPointY, endPointX4, endPointY)
      context.stroke()

      const scroll = this.$store.state.windowScroll
      this.broadcastCursorAndCurve({
        curve: {
          remoteControlPointOddY: controlPointOddY + scroll.y,
          remoteControlPointEvenY: controlPointEvenY + scroll.y,
          startPointX: startPointX + scroll.x,
          startPointY: startPointY + scroll.y,
          controlPointX1: controlPointX1 + scroll.x,
          endPointX1: endPointX1 + scroll.x,
          controlPointX2: controlPointX2 + scroll.x,
          endPointX2: endPointX2 + scroll.x,
          controlPointX3: controlPointX3 + scroll.x,
          endPointX3: endPointX3 + scroll.x,
          controlPointX4: controlPointX4 + scroll.x,
          endPointX4: endPointX4 + scroll.x,
          endPointY: endPointY + scroll.y
        },
        color: this.currentUserColor
      })
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
    broadcastCursorAndCurve ({ curve, color }) {
      const canEditSpace = this.$store.getters['currentUser/canEditSpace']()
      if (!canEditSpace) { return }
      let updates = {}
      updates.x = this.currentCursorInSpace.x
      updates.y = this.currentCursorInSpace.y
      updates.color = color
      updates.userId = this.$store.state.currentUser.id
      this.$store.commit('broadcast/update', { updates, type: 'updateRemoteUserCursor', handler: 'triggerUpdateRemoteUserCursor' })
      updates.curve = curve
      updates.color = color
      updates.frameId = nanoid()
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
