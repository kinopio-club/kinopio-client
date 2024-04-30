import utils from '@/utils.js'
import randomColor from 'randomcolor'
import shuffle from 'lodash-es/shuffle'
import dayjs from 'dayjs'

const size = 400

// move to being generated server (upload to dailyJournal/day.png)
// server route: daily journal prompt + daily journal img url
// ? sent to discord each day

const drawPanels = (context) => {
  const panels = shuffle([
    'one',
    'two',
    'three',
    'four',
    'five',
    'six'
  ])
  // draw calendar panels onto canvas element
  for (let panel of panels) {
    canvasPanels[panel](context)
  }
}
const sharedPanelAttributes = (context) => {
  context.miterLimit = 4
  context.fillStyle = randomColor()
  context.shadowColor = 'rgba(0,0,0,.3)'
  context.shadowBlur = 1
  context.shadowOffsetX = 0
  context.shadowOffsetY = 2
  return context.fill()
}

const canvasPanels = {
  one (context) {
    const controlPointX = size * 0.08
    const controlPointY = size * 0.5
    context.beginPath()
    context.moveTo(0, size)
    context.lineTo(size, size)
    context.lineTo(size, 0)
    context.lineTo(0, 0)
    context.lineTo(0, size)
    context.closePath()
    context.moveTo(controlPointX, size * 0.5)
    context.bezierCurveTo(controlPointX, size * 0.3, size * 0.215, size * 0.13825, size * 0.4, size * 0.09465)
    context.lineTo(size * 0.4, size * 0.90535)
    context.bezierCurveTo(size * 0.215, size * 0.86175, controlPointX, size * 0.7, controlPointX, size * 0.5)
    context.lineTo(controlPointX, size * 0.5)
    context.closePath()
    context.moveTo(size * 0.6, size * 0.90535)
    context.lineTo(size * 0.6, size * 0.09465)
    context.bezierCurveTo(size * 0.785, size * 0.13825, size * 0.92, size * 0.3, size * 0.92, size * 0.5)
    context.bezierCurveTo(size * 0.92, size * 0.7, size * 0.785, size * 0.86175, size * 0.6, size * 0.90535)
    context.lineTo(size * 0.6, size * 0.90535)
    context.closePath()
    return sharedPanelAttributes(context)
  },
  two (context) {
    context.beginPath()
    context.moveTo(0, size)
    context.lineTo(size, size)
    context.lineTo(size, 0)
    context.lineTo(0, 0)
    context.lineTo(0, size)
    context.closePath()
    context.moveTo(size * 0.4, size * 0.82)
    context.lineTo(size * 0.03835, size * 0.5)
    context.lineTo(size * 0.4, size * 0.18)
    context.lineTo(size * 0.4, size * 0.82)
    context.lineTo(size * 0.4, size * 0.82)
    context.closePath()
    context.moveTo(size * 0.5995, size * 0.82335)
    context.lineTo(size * 0.5995, size * 0.17665)
    context.lineTo(size * 0.96165, size * 0.5)
    context.lineTo(size * 0.5995, size * 0.82335)
    context.lineTo(size * 0.5995, size * 0.82335)
    context.closePath()
    return sharedPanelAttributes(context)
  },
  three (context) {
    context.beginPath()
    context.moveTo(0, size)
    context.lineTo(size, size)
    context.lineTo(size, 0)
    context.lineTo(0, 0)
    context.lineTo(0, size)
    context.closePath()
    context.moveTo(size * 0.15665, size * 0.72835)
    context.lineTo(size * 0.84335, size * 0.72835)
    context.lineTo(size * 0.84335, size * 0.82)
    context.lineTo(size * 0.15665, size * 0.82)
    context.lineTo(size * 0.15665, size * 0.72835)
    context.closePath()
    context.moveTo(size * 0.15665, size * 0.54165)
    context.lineTo(size * 0.84335, size * 0.54165)
    context.lineTo(size * 0.84335, size * 0.63335)
    context.lineTo(size * 0.15665, size * 0.63335)
    context.lineTo(size * 0.15665, size * 0.54165)
    context.closePath()
    context.moveTo(size * 0.15665, size * 0.365)
    context.lineTo(size * 0.84335, size * 0.365)
    context.lineTo(size * 0.84335, size * 0.45665)
    context.lineTo(size * 0.15665, size * 0.45665)
    context.lineTo(size * 0.15665, size * 0.365)
    context.closePath()
    context.moveTo(size * 0.15665, size * 0.17835)
    context.lineTo(size * 0.84335, size * 0.17835)
    context.lineTo(size * 0.84335, size * 0.27)
    context.lineTo(size * 0.15665, size * 0.27)
    context.lineTo(size * 0.15665, size * 0.17835)
    context.closePath()
    return sharedPanelAttributes(context)
  },
  four (context) {
    context.beginPath()
    context.moveTo(0, size)
    context.lineTo(size, size)
    context.lineTo(size, 0)
    context.lineTo(0, 0)
    context.lineTo(0, size)
    context.closePath()
    context.moveTo(size * 0.96165, size * 0.51135)
    context.bezierCurveTo(size * 0.96165, size * 0.57995, size * 0.9072, size * 0.6356, size * 0.84005, size * 0.6356)
    context.lineTo(size * 0.15995, size * 0.6356)
    context.bezierCurveTo(size * 0.0928, size * 0.6356, size * 0.03835, size * 0.57995, size * 0.03835, size * 0.51135)
    context.lineTo(size * 0.03835, size * 0.48865)
    context.bezierCurveTo(size * 0.03835, size * 0.42005, size * 0.0928, size * 0.3644, size * 0.15995, size * 0.3644)
    context.lineTo(size * 0.84005, size * 0.3644)
    context.bezierCurveTo(size * 0.9072, size * 0.3644, size * 0.96165, size * 0.42005, size * 0.96165, size * 0.48865)
    context.lineTo(size * 0.96165, size * 0.51135)
    context.lineTo(size * 0.96165, size * 0.51135)
    context.closePath()
    return sharedPanelAttributes(context)
  },
  five (context) {
    context.beginPath()
    context.moveTo(0, size)
    context.lineTo(size, size)
    context.lineTo(size, 0)
    context.lineTo(0, 0)
    context.lineTo(0, size)
    context.closePath()
    context.moveTo(size * 0.08335, size * 0.17665)
    context.lineTo(size * 0.15665, size * 0.17665)
    context.lineTo(size * 0.15665, size * 0.82665)
    context.lineTo(size * 0.08335, size * 0.82665)
    context.lineTo(size * 0.08335, size * 0.17665)
    context.closePath()
    context.moveTo(size * 0.16835, size * 0.84335)
    context.lineTo(size * 0.81835, size * 0.84335)
    context.lineTo(size * 0.81835, size * 0.91835)
    context.lineTo(size * 0.16835, size * 0.91835)
    context.lineTo(size * 0.16835, size * 0.84335)
    context.closePath()
    context.moveTo(size * 0.40335, size * 0.5)
    context.bezierCurveTo(size * 0.40335, size * 0.446, size * 0.446, size * 0.40335, size * 0.5, size * 0.40335)
    context.bezierCurveTo(size * 0.554, size * 0.40335, size * 0.59665, size * 0.446, size * 0.59665, size * 0.5)
    context.bezierCurveTo(size * 0.59665, size * 0.554, size * 0.554, size * 0.59665, size * 0.5, size * 0.59665)
    context.bezierCurveTo(size * 0.446, size * 0.59665, size * 0.40335, size * 0.554, size * 0.40335, size * 0.5)
    context.lineTo(size * 0.40335, size * 0.5)
    context.closePath()
    context.moveTo(size * 0.17665, size * 0.08335)
    context.lineTo(size * 0.82665, size * 0.08335)
    context.lineTo(size * 0.82665, size * 0.15665)
    context.lineTo(size * 0.17665, size * 0.15665)
    context.lineTo(size * 0.17665, size * 0.08335)
    context.closePath()
    context.moveTo(size * 0.84335, size * 0.17665)
    context.lineTo(size * 0.91835, size * 0.17665)
    context.lineTo(size * 0.91835, size * 0.82665)
    context.lineTo(size * 0.84335, size * 0.82665)
    context.lineTo(size * 0.84335, size * 0.17665)
    context.closePath()
    return sharedPanelAttributes(context)
  },
  six (context) {
    context.beginPath()
    context.moveTo(0, size)
    context.lineTo(size, size)
    context.lineTo(size, 0)
    context.lineTo(0, 0)
    context.lineTo(0, size)
    context.closePath()
    context.moveTo(size * 0.2071, size * 0.20375)
    context.lineTo(size * 0.795, size * 0.20375)
    context.lineTo(size * 0.795, size * 0.79165)
    context.lineTo(size * 0.2071, size * 0.79165)
    context.lineTo(size * 0.2071, size * 0.20375)
    context.closePath()
    return sharedPanelAttributes(context)
  }
}

const self = {
  namespaced: true,
  actions: {
    // timer: every morning
    create: async (context) => {
      try {
        // init canvas
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const context = canvas.getContext('2d')
        const blob = drawPanels(context)
        // convert canvas toBlob
        canvas.toBlob((blob) => {
          const newImg = document.createElement('img')
          const url = URL.createObjectURL(blob)

          newImg.onload = () => {
            // no longer need to read the blob so it's revoked
            URL.revokeObjectURL(url)
          }
          newImg.src = url
          document.body.appendChild(newImg)
          // todo upload to unique url
          // then discord
          // file name: daily perpetual image
          // ?? journalspaces get spaceDailyPerpetualImageUrl
        })
      } catch (error) {
        console.error('🚒 journalCalendar create', error)
      }
    }
  }
}

export default self
